"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { DollarSign, TrendingUp, Star, ChevronDown, ChevronUp, Flame, Minus } from "lucide-react";

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
};

const MACRO_EVENTS: MacroEvent[] = [
  { day: "Mon", label: "Consumer Confidence", labelHe: "סנטימנט צרכנים",
    description: "Conference Board survey. Weak reading → less spending → lower earnings for retail stocks.",
    descriptionHe: "קריאה חלשה → פחות הוצאות → רווחים נמוכים למניות קמעונאות.",
    impact: "medium", sentiment: "neutral" },
  { day: "Tue", label: "JOLTS Job Openings", labelHe: "משרות פנויות JOLTS",
    description: "Too many openings = wage inflation = pressure to keep rates high. Bad for growth stocks.",
    descriptionHe: "יותר מדי משרות = לחץ שכר = ריבית גבוהה. רע למניות צמיחה.",
    impact: "high", sentiment: "bad" },
  { day: "Wed", label: "GDP Growth Rate Q1", labelHe: "צמיחת תמ\"ג",
    description: "Two negative quarters = recession. Markets react sharply to misses vs. consensus.",
    descriptionHe: "שני רבעונים שליליים = מיתון. השוק מגיב חזק לחריגות.",
    impact: "high", sentiment: "neutral" },
  { day: "Wed", label: "Core PCE Deflator", labelHe: "מדד PCE הליבה",
    description: "The Fed's preferred inflation gauge. Above 2.5% → rate cut delays. Can move markets 2%+.",
    descriptionHe: "מד האינפלציה המועדף של הפד. מעל 2.5% = עיכוב בהורדת ריבית.",
    impact: "high", sentiment: "bad" },
  { day: "Thu", label: "Initial Jobless Claims", labelHe: "תביעות אבטלה",
    description: "Rising claims = cooling economy = Fed may cut sooner. Moderate rise is bullish for bonds.",
    descriptionHe: "עלייה = כלכלה מתקררת = הפד יוריד ריבית מוקדם יותר.",
    impact: "medium", sentiment: "neutral" },
  { day: "Thu", label: "ISM Manufacturing PMI", labelHe: "ISM ייצור PMI",
    description: "Above 50 = expansion. A surprise above 50 could boost industrials and signal recovery.",
    descriptionHe: "מעל 50 = התרחבות. הפתעה חיובית תגביר מניות תעשייה.",
    impact: "medium", sentiment: "good" },
  { day: "Fri", label: "Non-Farm Payrolls", labelHe: "שכר לא חקלאי — NFP",
    description: "The most market-moving monthly report. Too strong or too weak — both trigger volatility.",
    descriptionHe: "הדוח הכי משפיע. חזק מדי = פחד אינפלציה. חלש מדי = פחד מיתון.",
    impact: "high", sentiment: "bad" },
];

const WEEKDAYS: MacroEvent["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKDAYS_HE: Record<MacroEvent["day"], string> = { Mon: "שני", Tue: "שלישי", Wed: "רביעי", Thu: "חמישי", Fri: "שישי" };

const impactColor: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#6b7280" };
const sentimentBg: Record<Sentiment, string> = { bad: "bg-red-500/8 border-red-500/15", neutral: "bg-yellow-500/8 border-yellow-500/15", good: "bg-green-500/8 border-green-500/15" };
const sentimentText: Record<Sentiment, string> = { bad: "text-brand-red", neutral: "text-brand-yellow", good: "text-brand-green" };

function ImpactDots({ impact }: { impact: "high" | "medium" | "low" }) {
  const filled = impact === "high" ? 3 : impact === "medium" ? 2 : 1;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: i <= filled ? impactColor[impact] : "#ffffff15" }} />
      ))}
    </div>
  );
}

export default function EventCalendar() {
  const { t, lang, isRTL, portfolio } = useApp();
  const [view, setView] = useState<"earnings" | "macro">("earnings");
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMacro, setExpandedMacro] = useState<number | null>(null);
  const portfolioSymbols = new Set(portfolio.map(p => p.symbol));

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.json())
      .then(data => setEarnings(Array.isArray(data) ? data.slice(0, 20) : []))
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
        <button onClick={() => setView("earnings")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            view === "earnings" ? "bg-brand-accent text-white shadow-glow" : "text-gray-400 hover:text-white"
          }`}>
          <DollarSign size={14} />
          {lang === "he" ? "דוחות" : "Earnings"}
        </button>
        <button onClick={() => setView("macro")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            view === "macro" ? "bg-brand-accent text-white shadow-glow" : "text-gray-400 hover:text-white"
          }`}>
          <TrendingUp size={14} />
          {lang === "he" ? "מאקרו" : "Macro"}
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
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <DollarSign size={24} className="text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">{t("noData")}</p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* ─── MACRO VIEW ─── */}
      {view === "macro" && (
        <div className="space-y-4">
          {WEEKDAYS.map(day => {
            const events = MACRO_EVENTS.filter(ev => ev.day === day);
            if (!events.length) return null;
            const hasHigh = events.some(ev => ev.impact === "high");
            return (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    hasHigh ? "bg-red-500/15 text-brand-red" : "bg-white/8 text-gray-400"
                  }`}>
                    {lang === "he" ? WEEKDAYS_HE[day] : day}
                  </div>
                  <div className="flex-1 h-px bg-brand-border" />
                  {hasHigh && <Flame size={12} className="text-brand-red" />}
                </div>

                {/* Events */}
                <div className="space-y-2 ps-0">
                  {events.map((ev, i) => {
                    const globalIdx = MACRO_EVENTS.indexOf(ev);
                    const isOpen = expandedMacro === globalIdx;
                    return (
                      <button key={i} onClick={() => setExpandedMacro(isOpen ? null : globalIdx)}
                        className={`w-full text-start rounded-2xl border p-4 transition-all ${sentimentBg[ev.sentiment]}`}>
                        <div className="flex items-center gap-3">
                          {/* Impact dots */}
                          <ImpactDots impact={ev.impact} />

                          {/* Title */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold leading-tight">
                              {lang === "he" ? ev.labelHe : ev.label}
                            </p>
                            {!isOpen && (
                              <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                                {lang === "he" ? ev.descriptionHe : ev.description}
                              </p>
                            )}
                          </div>

                          {/* Sentiment + expand */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${sentimentText[ev.sentiment]} bg-black/20`}>
                              {ev.sentiment === "bad" ? (lang === "he" ? "סיכון" : "Risk")
                                : ev.sentiment === "good" ? (lang === "he" ? "חיובי" : "Bullish")
                                : (lang === "he" ? "נייטרל" : "Watch")}
                            </span>
                            {isOpen ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-white/8">
                            <p className="text-gray-300 text-xs leading-relaxed">
                              {lang === "he" ? ev.descriptionHe : ev.description}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
