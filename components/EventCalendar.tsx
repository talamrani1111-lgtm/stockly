"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { DollarSign, TrendingUp, Star, Minus, TrendingDown, Activity } from "lucide-react";

type EarningsEvent = {
  date: string;
  symbol: string;
  epsEstimate: number | null;
  revenueEstimate: number | null;
  hour: string;
};

type Sentiment = "bad" | "neutral" | "good";
type MacroEvent = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  label: string; labelHe: string;
  description: string; descriptionHe: string;
  impact: "high" | "medium" | "low";
  sentiment: Sentiment;
  emoji: string;
};

const MACRO_EVENTS: MacroEvent[] = [
  { day: "Mon", label: "Consumer Confidence", labelHe: "סנטימנט צרכנים",
    description: "Conference Board survey. Weak reading → less spending → lower earnings for retail stocks.",
    descriptionHe: "קריאה חלשה = פחות הוצאות = רווחים נמוכים למניות קמעונאות.",
    impact: "medium", sentiment: "neutral", emoji: "🛍️" },
  { day: "Tue", label: "JOLTS Job Openings", labelHe: "משרות פנויות JOLTS",
    description: "Too many openings = wage inflation = pressure to keep rates high. Bad for growth stocks.",
    descriptionHe: "יותר מדי משרות = לחץ שכר = ריבית גבוהה. רע למניות צמיחה.",
    impact: "high", sentiment: "bad", emoji: "💼" },
  { day: "Wed", label: "GDP Growth Rate Q1", labelHe: "צמיחת תמ\"ג רבעון 1",
    description: "Two negative quarters = recession. Markets react sharply to misses vs. consensus.",
    descriptionHe: "שני רבעונים שליליים = מיתון. השוק מגיב חזק לחריגות.",
    impact: "high", sentiment: "neutral", emoji: "📊" },
  { day: "Wed", label: "Core PCE Deflator", labelHe: "אינפלציה PCE ליבה",
    description: "The Fed's preferred inflation gauge. Above 2.5% → rate cut delays. Can move markets 2%+.",
    descriptionHe: "מד האינפלציה המועדף של הפד. מעל 2.5% = עיכוב בהורדת ריבית. יכול להזיז שוק 2%+.",
    impact: "high", sentiment: "bad", emoji: "🔥" },
  { day: "Thu", label: "Initial Jobless Claims", labelHe: "תביעות אבטלה",
    description: "Rising claims = cooling economy = Fed may cut sooner. Moderate rise is bullish for bonds.",
    descriptionHe: "עלייה = כלכלה מתקררת = הפד יוריד ריבית מוקדם יותר. חיובי לאג\"ח.",
    impact: "medium", sentiment: "neutral", emoji: "📋" },
  { day: "Thu", label: "ISM Manufacturing PMI", labelHe: "ISM ייצור PMI",
    description: "Above 50 = expansion. A surprise above 50 could boost industrials and signal recovery.",
    descriptionHe: "מעל 50 = התרחבות. הפתעה חיובית תגביר מניות תעשייה.",
    impact: "medium", sentiment: "good", emoji: "🏭" },
  { day: "Fri", label: "Non-Farm Payrolls", labelHe: "שכר לא חקלאי — NFP",
    description: "The most market-moving monthly report. Too strong or too weak — both trigger volatility.",
    descriptionHe: "הדוח הכי משפיע בשוק. חזק מדי = פחד אינפלציה. חלש מדי = פחד מיתון.",
    impact: "high", sentiment: "bad", emoji: "💥" },
];

const DAY_TO_NUM: Record<MacroEvent["day"], number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
const WEEKDAYS: MacroEvent["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKDAYS_HE: Record<MacroEvent["day"], string> = { Mon: "שני", Tue: "שלישי", Wed: "רביעי", Thu: "חמישי", Fri: "שישי" };

function getWeekDate(day: MacroEvent["day"]): Date {
  const today = new Date();
  const todayNum = today.getDay();
  const targetNum = DAY_TO_NUM[day];
  const diff = targetNum - (todayNum === 0 ? 7 : todayNum);
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

function isToday(day: MacroEvent["day"]): boolean {
  const today = new Date().getDay();
  return DAY_TO_NUM[day] === (today === 0 ? 7 : today);
}

const impactColor: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#6b7280" };
const impactBg: Record<string, string> = { high: "bg-red-500/15 text-brand-red", medium: "bg-yellow-500/15 text-brand-yellow", low: "bg-gray-500/15 text-gray-400" };
const sentimentConfig: Record<Sentiment, { bg: string; border: string; icon: React.ReactNode; label: string; labelHe: string }> = {
  bad:     { bg: "bg-red-500/6",    border: "border-red-500/20",    icon: <TrendingDown size={11} />, label: "Risk",    labelHe: "סיכון" },
  neutral: { bg: "bg-yellow-500/6", border: "border-yellow-500/20", icon: <Minus size={11} />,        label: "Watch",   labelHe: "מעקב" },
  good:    { bg: "bg-green-500/6",  border: "border-green-500/20",  icon: <TrendingUp size={11} />,   label: "Bullish", labelHe: "חיובי" },
};
const sentimentText: Record<Sentiment, string> = { bad: "text-brand-red", neutral: "text-brand-yellow", good: "text-brand-green" };

export default function EventCalendar() {
  const { t, lang, isRTL, portfolio } = useApp();
  const [view, setView] = useState<"earnings" | "macro">("macro");
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const portfolioSymbols = new Set(portfolio.map(p => p.symbol));
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.json())
      .then(data => setEarnings(Array.isArray(data) ? data.slice(0, 40) : []))
      .catch(() => setEarnings([]))
      .finally(() => setLoading(false));
  }, []);

  // Group earnings by date
  const earningsByDate = earnings.reduce<Record<string, EarningsEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const sortedDates = Object.keys(earningsByDate).sort();

  function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
      weekday: "long", month: "short", day: "numeric",
    });
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>

      {/* View toggle */}
      <div className="flex bg-brand-card border border-brand-border rounded-2xl p-1 mb-5 gap-1">
        <button onClick={() => setView("macro")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            view === "macro" ? "bg-brand-accent text-white shadow-glow" : "text-gray-400 hover:text-white"
          }`}>
          <TrendingUp size={14} />
          {lang === "he" ? "מאקרו" : "Macro"}
        </button>
        <button onClick={() => setView("earnings")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            view === "earnings" ? "bg-brand-accent text-white shadow-glow" : "text-gray-400 hover:text-white"
          }`}>
          <DollarSign size={14} />
          {lang === "he" ? "דוחות" : "Earnings"}
        </button>
      </div>

      {/* ─── EARNINGS VIEW ─── */}
      {view === "earnings" && (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="shimmer h-4 w-32 mb-2 rounded" />
                  <div className="space-y-2">
                    {[1, 2].map(j => <div key={j} className="bg-brand-card border border-brand-border rounded-2xl p-3 flex gap-3"><div className="shimmer w-10 h-10 rounded-xl" /><div className="flex-1"><div className="shimmer h-4 w-16 mb-1.5" /><div className="shimmer h-3 w-24" /></div></div>)}
                  </div>
                </div>
              ))}
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">📅</div>
              <p className="text-white text-sm font-semibold">{lang === "he" ? "אין דוחות השבוע" : "No earnings this week"}</p>
              <p className="text-gray-500 text-xs">{lang === "he" ? "לא נמצאו דוחות קרובים" : "No upcoming reports found"}</p>
            </div>
          ) : (() => {
            const todayEarnings = earningsByDate[todayStr];
            return (
            <>
              {!todayEarnings && (
                <div className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-2xl px-4 py-3 mb-4">
                  <span className="text-lg">✅</span>
                  <p className="text-gray-400 text-sm">
                    {lang === "he" ? "אין דוחות היום — בדוק בימים הקרובים" : "No earnings today — check upcoming days"}
                  </p>
                </div>
              )}

            <div className="space-y-5">
              {sortedDates.map(date => (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                      {formatDateHeader(date)}
                    </span>
                    <div className="flex-1 h-px bg-brand-border" />
                    <span className="text-gray-600 text-xs">{earningsByDate[date].length}</span>
                  </div>

                  {/* Cards for this date */}
                  <div className="space-y-2">
                    {earningsByDate[date].map((ev, i) => {
                      const inPortfolio = portfolioSymbols.has(ev.symbol);
                      const isBMO = ev.hour === "bmo";
                      return (
                        <div key={i} className={`rounded-2xl border p-4 flex items-center gap-4 ${
                          inPortfolio
                            ? "bg-brand-accent/8 border-brand-accent/25"
                            : "bg-brand-card border-brand-border"
                        }`}>
                          {/* Symbol icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            inPortfolio ? "bg-brand-accent/20" : "bg-white/5"
                          }`}>
                            {inPortfolio
                              ? <Star size={16} className="text-brand-accent" />
                              : <span className="text-gray-400 font-bold text-xs">{ev.symbol.slice(0, 2)}</span>}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-base ${inPortfolio ? "text-brand-accent" : "text-white"}`}>
                              {ev.symbol}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {ev.epsEstimate && (
                                <span className="text-gray-400 text-xs">
                                  EPS: <span className="text-gray-200 font-medium">${ev.epsEstimate.toFixed(2)}</span>
                                </span>
                              )}
                              {ev.revenueEstimate && (
                                <span className="text-gray-400 text-xs">
                                  Rev: <span className="text-gray-200 font-medium">${(ev.revenueEstimate / 1e9).toFixed(1)}B</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Time badge */}
                          <div className={`flex flex-col items-center gap-1 flex-shrink-0 px-3 py-2 rounded-xl ${
                            isBMO ? "bg-brand-green/12 border border-brand-green/20" : "bg-brand-yellow/12 border border-brand-yellow/20"
                          }`}>
                            <span className={`text-xs font-bold ${isBMO ? "text-brand-green" : "text-brand-yellow"}`}>
                              {isBMO ? (lang === "he" ? "לפני" : "BMO") : (lang === "he" ? "אחרי" : "AMC")}
                            </span>
                            <span className="text-gray-500 text-[9px]">{lang === "he" ? "פתיחה" : "open"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            </>
            );
          })()}
        </div>
      )}

      {/* ─── MACRO VIEW ─── */}
      {view === "macro" && (
        <div>
          {/* Legend */}
          <div className="flex items-center gap-3 mb-4 px-1">
            {(["high", "medium"] as const).map(lvl => (
              <div key={lvl} className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1,2,3].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: i <= (lvl === "high" ? 3 : 2) ? impactColor[lvl] : "#ffffff15" }} />
                  ))}
                </div>
                <span className="text-gray-500 text-[10px]">{lvl === "high" ? (lang === "he" ? "השפעה גבוהה" : "High impact") : (lang === "he" ? "בינוני" : "Medium")}</span>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {WEEKDAYS.map(day => {
              const events = MACRO_EVENTS.filter(ev => ev.day === day);
              if (!events.length) return null;
              const hasHigh = events.some(ev => ev.impact === "high");
              const today = isToday(day);
              const weekDate = getWeekDate(day);
              const dateLabel = weekDate.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { day: "numeric", month: "short" });

              return (
                <div key={day}>
                  {/* Day header */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0 ${
                      today ? "bg-brand-accent text-white" : hasHigh ? "bg-red-500/12 text-brand-red" : "bg-white/6 text-gray-400"
                    }`}>
                      <span className="text-xs font-bold">{lang === "he" ? WEEKDAYS_HE[day] : day}</span>
                      <span className={`text-[10px] font-medium ${today ? "text-white/70" : "opacity-60"}`}>{dateLabel}</span>
                    </div>
                    {today && (
                      <span className="text-brand-accent text-[10px] font-bold bg-brand-accent/10 px-2 py-0.5 rounded-lg">
                        {lang === "he" ? "היום" : "Today"}
                      </span>
                    )}
                    <div className="flex-1 h-px bg-brand-border" />
                    {hasHigh && <Activity size={12} className="text-brand-red flex-shrink-0" />}
                  </div>

                  {/* Events */}
                  <div className="space-y-2.5">
                    {events.map((ev, i) => {
                      const sc = sentimentConfig[ev.sentiment];
                      return (
                        <div key={i} className={`rounded-2xl border p-4 ${sc.bg} ${sc.border}`}>
                          {/* Top row: emoji + title + impact badge */}
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">{ev.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-white text-sm font-bold leading-tight">
                                  {lang === "he" ? ev.labelHe : ev.label}
                                </p>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${impactBg[ev.impact]}`}>
                                  {ev.impact === "high" ? (lang === "he" ? "השפעה גבוהה" : "HIGH") : (lang === "he" ? "בינוני" : "MED")}
                                </span>
                              </div>
                              {/* Impact dots */}
                              <div className="flex gap-0.5 mb-2">
                                {[1,2,3].map(i => (
                                  <span key={i} className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: i <= (ev.impact === "high" ? 3 : ev.impact === "medium" ? 2 : 1) ? impactColor[ev.impact] : "#ffffff15" }} />
                                ))}
                              </div>
                              {/* Description - always visible */}
                              <p className="text-gray-300 text-xs leading-relaxed">
                                {lang === "he" ? ev.descriptionHe : ev.description}
                              </p>
                            </div>
                            {/* Sentiment badge */}
                            <div className={`flex items-center gap-1 text-[10px] font-bold flex-shrink-0 px-2 py-1 rounded-xl bg-black/20 ${sentimentText[ev.sentiment]}`}>
                              {sc.icon}
                              <span>{lang === "he" ? sc.labelHe : sc.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Footer note */}
            <p className="text-gray-600 text-[10px] text-center pt-2">
              {lang === "he" ? "נתונים שבועיים — עשויים להשתנות" : "Weekly schedule · subject to change"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
