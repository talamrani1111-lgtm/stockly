"use client";
import { useApp } from "@/lib/context";
import { TrendingUp, TrendingDown, Flame, Target, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

type Quote = { symbol: string; price: number; change: number; changePercent: number };

type Props = {
  quotes: Record<string, Quote>;
  forex: number;
  totalValueUSD: number;
  totalPnL: number;
  totalCostUSD: number;
  streak: number;
};

function greeting(lang: "he" | "en"): string {
  const h = new Date().getHours();
  if (lang === "he") {
    if (h < 6)  return "לילה טוב";
    if (h < 12) return "בוקר טוב";
    if (h < 17) return "צהריים טובים";
    if (h < 21) return "ערב טוב";
    return "לילה טוב";
  }
  if (h < 6)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function formatDate(lang: string): string {
  const now = new Date();
  if (lang === "he") {
    return now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  return now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function getTomorrowStatus(lang: string): { label: string; open: boolean } {
  const now = new Date();
  const nyNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nyNow.getDay(); // 0=Sun, 6=Sat

  // Tomorrow's day
  const tmrDay = (day + 1) % 7;
  const isWeekend = tmrDay === 0 || tmrDay === 6;

  if (isWeekend) {
    return {
      open: false,
      label: lang === "he"
        ? `מחר הבורסה סגורה (${tmrDay === 0 ? "ראשון" : "שבת"})`
        : `Market closed tomorrow (${tmrDay === 0 ? "Sunday" : "Saturday"})`,
    };
  }
  return {
    open: true,
    label: lang === "he" ? "מחר הבורסה פתוחה" : "Market open tomorrow",
  };
}

export default function DailyInsight({ quotes, forex: _forex, totalValueUSD, totalPnL, totalCostUSD, streak }: Props) {
  const { lang, isRTL, portfolio } = useApp();
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!Object.keys(quotes).length || !portfolio.length) return null;

  const movers = portfolio
    .filter(p => !p.manualPrice && quotes[p.symbol])
    .map(p => {
      const q = quotes[p.symbol];
      const dailyPnL = q.change * p.shares;
      return { symbol: p.symbol, pct: q.changePercent, dailyPnL, price: q.price };
    })
    .sort((a, b) => b.dailyPnL - a.dailyPnL);

  const best  = movers[0];
  const worst = movers[movers.length - 1];
  const dailyChangeUSD = movers.reduce((s, m) => s + m.dailyPnL, 0);
  const dayUp  = dailyChangeUSD >= 0;
  const returnPct = totalCostUSD > 0 ? (totalPnL / totalCostUSD) * 100 : 0;

  // Build "why today" explanation
  const topContributors = [...movers].sort((a, b) => Math.abs(b.dailyPnL) - Math.abs(a.dailyPnL)).slice(0, 3);
  const bigMover = topContributors[0];
  const isHe = lang === "he";

  function whyToday(): string {
    if (!bigMover) return "";
    const sign = bigMover.dailyPnL >= 0 ? "+" : "";
    const contrib = `${sign}$${Math.abs(bigMover.dailyPnL).toFixed(0)}`;
    const pctSign = bigMover.pct >= 0 ? "+" : "";

    if (isHe) {
      const main = `${bigMover.symbol} ${bigMover.pct >= 0 ? "עלתה" : "ירדה"} ${pctSign}${bigMover.pct.toFixed(1)}% ותרמה ${contrib} לתיק`;
      if (topContributors.length > 1) {
        const second = topContributors[1];
        const s2sign = second.pct >= 0 ? "+" : "";
        return `${main}. ${second.symbol} ${second.pct >= 0 ? "עלתה" : "ירדה"} ${s2sign}${second.pct.toFixed(1)}%.`;
      }
      return main + ".";
    } else {
      const main = `${bigMover.symbol} ${bigMover.pct >= 0 ? "gained" : "fell"} ${pctSign}${bigMover.pct.toFixed(1)}%, adding ${contrib} to your portfolio`;
      if (topContributors.length > 1) {
        const second = topContributors[1];
        const s2sign = second.pct >= 0 ? "+" : "";
        return `${main}. ${second.symbol} ${second.pct >= 0 ? "gained" : "fell"} ${s2sign}${second.pct.toFixed(1)}%.`;
      }
      return main + ".";
    }
  }

  // Tomorrow info
  const tomorrow = getTomorrowStatus(lang);

  // Upcoming earnings (from localStorage if EarningsCountdown saved something, or just prompt)
  function nextEarningsNote(): string | null {
    const allSymbols = portfolio.filter(p => !p.manualPrice).map(p => p.symbol);
    if (!allSymbols.length) return null;
    // We don't have earnings data here, just show a reminder if any
    return isHe
      ? `בדוק את ספירת הדוחות לפרטים על הדוחות הקרובים`
      : `Check the earnings countdown for upcoming reports`;
  }

  const why = whyToday();
  const tmrNote = nextEarningsNote();

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>

      {/* Date */}
      <div className="flex items-center gap-1.5 mb-3">
        <CalendarDays size={11} className="text-gray-600" />
        <p className="text-gray-600 text-[10px]">{formatDate(lang)}</p>
      </div>

      {/* Greeting row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-base">{greeting(lang)} 👋</p>
          <p className={clsx("text-sm font-semibold mt-0.5", dayUp ? "text-brand-green" : "text-brand-red")}>
            {isHe
              ? `התיק שלך ${dayUp ? "עלה" : "ירד"} ${dayUp ? "+" : ""}$${Math.abs(dailyChangeUSD).toFixed(0)} היום`
              : `Your portfolio ${dayUp ? "gained" : "lost"} ${dayUp ? "+" : "-"}$${Math.abs(dailyChangeUSD).toFixed(0)} today`}
          </p>
        </div>
        {streak >= 2 && (
          <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl px-2.5 py-1.5">
            <Flame size={14} className="text-orange-400" />
            <span className="text-orange-400 text-xs font-bold">{streak}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-brand-surface rounded-xl p-2.5 text-center">
          <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1">{isHe ? "היום" : "Today"}</p>
          <p className={clsx("text-sm font-bold", dayUp ? "text-brand-green" : "text-brand-red")}>
            {dayUp ? "+" : ""}${Math.abs(dailyChangeUSD).toFixed(0)}
          </p>
        </div>
        <div className="bg-brand-surface rounded-xl p-2.5 text-center">
          <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1">{isHe ? "סה״כ" : "Total"}</p>
          <p className={clsx("text-sm font-bold", totalPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
            {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
          </p>
        </div>
        <div className="bg-brand-surface rounded-xl p-2.5 text-center">
          <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1">{isHe ? "שווי" : "Value"}</p>
          <p className="text-white text-sm font-bold">
            ${totalValueUSD >= 1000 ? `${(totalValueUSD / 1000).toFixed(1)}K` : totalValueUSD.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Best / Worst */}
      {movers.length >= 2 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {best && (
            <div className="flex items-center gap-2 bg-brand-green/8 rounded-xl px-3 py-2">
              <TrendingUp size={13} className="text-brand-green flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-brand-green text-xs font-bold">{best.symbol}</p>
                <p className="text-gray-400 text-[10px]">{best.pct >= 0 ? "+" : ""}{best.pct.toFixed(2)}%</p>
              </div>
            </div>
          )}
          {worst && worst.symbol !== best?.symbol && (
            <div className="flex items-center gap-2 bg-brand-red/8 rounded-xl px-3 py-2">
              <TrendingDown size={13} className="text-brand-red flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-brand-red text-xs font-bold">{worst.symbol}</p>
                <p className="text-gray-400 text-[10px]">{worst.pct.toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WHY TODAY explanation */}
      {why && (
        <div className={clsx("rounded-xl px-3 py-2.5 mb-3 border",
          dayUp ? "bg-brand-green/5 border-brand-green/15" : "bg-brand-red/5 border-brand-red/15")}>
          <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1">
            {isHe ? "למה התיק זז היום?" : "Why did it move today?"}
          </p>
          <p className="text-gray-300 text-[11px] leading-relaxed">{why}</p>

          {/* Expandable breakdown */}
          {movers.length > 1 && (
            <>
              <button onClick={() => setShowBreakdown(v => !v)}
                className="flex items-center gap-1 text-gray-600 text-[9px] mt-1.5 hover:text-gray-400 transition-colors">
                {showBreakdown
                  ? <><ChevronUp size={9} />{isHe ? "הסתר" : "Hide"}</>
                  : <><ChevronDown size={9} />{isHe ? "פירוט לפי מניה" : "Per-stock breakdown"}</>}
              </button>
              {showBreakdown && (
                <div className="mt-2 space-y-1">
                  {movers.map(m => (
                    <div key={m.symbol} className="flex items-center justify-between">
                      <span className="text-gray-500 text-[10px] font-bold">{m.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className={clsx("text-[10px]", m.pct >= 0 ? "text-brand-green" : "text-brand-red")}>
                          {m.pct >= 0 ? "+" : ""}{m.pct.toFixed(2)}%
                        </span>
                        <span className={clsx("text-[10px] font-bold w-16 text-end",
                          m.dailyPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
                          {m.dailyPnL >= 0 ? "+" : ""}${Math.abs(m.dailyPnL).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TOMORROW forecast */}
      <div className="rounded-xl px-3 py-2.5 border border-white/8 bg-white/3">
        <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1.5">
          {isHe ? "מה צפוי מחר?" : "What to expect tomorrow?"}
        </p>
        <div className="flex items-center gap-2 mb-1.5">
          <div className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", tomorrow.open ? "bg-brand-green" : "bg-brand-red")} />
          <p className={clsx("text-[11px] font-semibold", tomorrow.open ? "text-brand-green" : "text-gray-400")}>
            {tomorrow.label}
          </p>
        </div>
        {tomorrow.open && (
          <div className="space-y-1">
            <p className="text-gray-500 text-[10px]">
              {isHe
                ? `${dayUp ? "מומנטום חיובי — שמור על עין על המניות שהובילו היום" : "שמור על עין — יתכן המשך לחץ מחר"}`
                : `${dayUp ? "Positive momentum today — watch your leading stocks" : "Keep watching — possible continued pressure tomorrow"}`}
            </p>
            {best && (
              <p className="text-gray-600 text-[10px]">
                {isHe
                  ? `• ${best.symbol} — ${best.pct >= 3 ? "עלייה חדה, יתכן תיקון קטן" : "שמור על עין"}`
                  : `• ${best.symbol} — ${best.pct >= 3 ? "Sharp move today, watch for pullback" : "Monitor closely"}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Goal progress */}
      {(() => {
        try {
          const goal = parseFloat(localStorage.getItem("portfolio_goal") ?? "0");
          if (goal > 0 && totalValueUSD > 0) {
            const pct = Math.min((totalValueUSD / goal) * 100, 100);
            return (
              <div className="mt-3 pt-3 border-t border-brand-border">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target size={12} className="text-brand-accent" />
                    <span className="text-gray-400 text-[10px] font-semibold">
                      {isHe ? "יעד" : "Goal"}: ${goal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-brand-accent text-[10px] font-bold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          }
        } catch {}
        return null;
      })()}
    </div>
  );
}
