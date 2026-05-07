"use client";
import { useApp } from "@/lib/context";
import { TrendingUp, TrendingDown, Flame, Target } from "lucide-react";
import clsx from "clsx";

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

export default function DailyInsight({ quotes, forex: _forex, totalValueUSD, totalPnL, totalCostUSD, streak }: Props) {
  const { lang, isRTL, portfolio } = useApp();

  if (!Object.keys(quotes).length || !portfolio.length) return null;

  // Find best and worst mover today
  const movers = portfolio
    .filter(p => !p.manualPrice && quotes[p.symbol])
    .map(p => {
      const q = quotes[p.symbol];
      const dailyPnL = q.change * p.shares;
      return { symbol: p.symbol, pct: q.changePercent, dailyPnL };
    })
    .sort((a, b) => b.pct - a.pct);

  const best = movers[0];
  const worst = movers[movers.length - 1];
  const dailyChangeUSD = movers.reduce((s, m) => s + m.dailyPnL, 0);
  const dayUp = dailyChangeUSD >= 0;
  const returnPct = totalCostUSD > 0 ? (totalPnL / totalCostUSD) * 100 : 0;

  const userName = lang === "he" ? "" : "";

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Greeting row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-base">{greeting(lang)}{userName} 👋</p>
          <p className={clsx("text-sm font-semibold mt-0.5", dayUp ? "text-brand-green" : "text-brand-red")}>
            {lang === "he"
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
      <div className="grid grid-cols-3 gap-2">
        {/* Daily change */}
        <div className="bg-brand-surface rounded-xl p-2.5 text-center">
          <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1">
            {lang === "he" ? "היום" : "Today"}
          </p>
          <p className={clsx("text-sm font-bold", dayUp ? "text-brand-green" : "text-brand-red")}>
            {dayUp ? "+" : ""}${Math.abs(dailyChangeUSD).toFixed(0)}
          </p>
        </div>

        {/* Total return */}
        <div className="bg-brand-surface rounded-xl p-2.5 text-center">
          <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1">
            {lang === "he" ? "סה״כ" : "Total"}
          </p>
          <p className={clsx("text-sm font-bold", totalPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
            {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
          </p>
        </div>

        {/* Portfolio value */}
        <div className="bg-brand-surface rounded-xl p-2.5 text-center">
          <p className="text-gray-500 text-[9px] font-semibold uppercase mb-1">
            {lang === "he" ? "שווי" : "Value"}
          </p>
          <p className="text-white text-sm font-bold">
            ${totalValueUSD >= 1000
              ? `${(totalValueUSD / 1000).toFixed(1)}K`
              : totalValueUSD.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Best / Worst mover */}
      {movers.length >= 2 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {best && (
            <div className="flex items-center gap-2 bg-brand-green/8 rounded-xl px-3 py-2">
              <TrendingUp size={13} className="text-brand-green flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-brand-green text-xs font-bold">{best.symbol}</p>
                <p className="text-gray-400 text-[10px]">+{best.pct.toFixed(2)}%</p>
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

      {/* Goal progress (if set) */}
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
                      {lang === "he" ? "יעד" : "Goal"}: ${goal.toLocaleString()}
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
