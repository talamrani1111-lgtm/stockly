"use client";
import { useApp, PortfolioItem } from "@/lib/context";
import clsx from "clsx";

type Quote = { price: number; changePercent: number };

type Props = {
  quotes: Record<string, Quote>;
  forex: number;
};

function effectivePrice(item: PortfolioItem, quotes: Record<string, Quote>): number {
  if (item.manualPrice && item.manualPrice > 0) return item.manualPrice;
  return quotes[item.symbol]?.price ?? 0;
}

function heatColor(pct: number): string {
  if (pct >= 4)  return "bg-green-500";
  if (pct >= 2)  return "bg-green-600";
  if (pct >= 0.5) return "bg-green-800";
  if (pct >= -0.5) return "bg-gray-700";
  if (pct >= -2) return "bg-red-800";
  if (pct >= -4) return "bg-red-600";
  return "bg-red-500";
}

function textColor(pct: number): string {
  if (Math.abs(pct) >= 0.5) return "text-white";
  return "text-gray-400";
}

export default function PortfolioHeatMap({ quotes, forex }: Props) {
  const { portfolio, isRTL, lang } = useApp();

  if (portfolio.length < 2 || !Object.keys(quotes).length) return null;

  const totalUSD = portfolio.reduce((sum, item) => {
    const p = effectivePrice(item, quotes);
    const val = p * item.shares;
    return sum + (item.currency === "ILS" ? val / forex : val);
  }, 0);

  if (totalUSD <= 0) return null;

  const items = portfolio
    .map(item => {
      const p = effectivePrice(item, quotes);
      const val = p * item.shares;
      const valUSD = item.currency === "ILS" ? val / forex : val;
      const pct = item.manualPrice ? 0 : (quotes[item.symbol]?.changePercent ?? 0);
      return { symbol: item.symbol, valUSD, pct, weight: valUSD / totalUSD };
    })
    .filter(i => i.valUSD > 0)
    .sort((a, b) => b.valUSD - a.valUSD);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
        {lang === "he" ? "מפת חום — שינוי יומי" : "Heat Map — Daily Change"}
      </p>
      <div className="grid gap-1.5" style={{
        gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`,
      }}>
        {items.map(item => {
          const size = Math.max(item.weight, 0.05);
          return (
            <div
              key={item.symbol}
              className={clsx(
                "rounded-xl flex flex-col items-center justify-center transition-all",
                heatColor(item.pct),
              )}
              style={{ minHeight: `${Math.round(44 + size * 80)}px` }}
            >
              <span className={clsx("font-bold text-xs", textColor(item.pct))}>
                {item.symbol}
              </span>
              <span className={clsx("text-[10px] font-semibold mt-0.5", textColor(item.pct))}>
                {item.pct >= 0 ? "+" : ""}{item.pct.toFixed(2)}%
              </span>
              <span className="text-white/50 text-[9px] mt-0.5">
                {Math.round(item.weight * 100)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1.5 items-center">
          <div className="w-3 h-2 rounded bg-red-500" />
          <span className="text-gray-600 text-[9px]">{"< -4%"}</span>
          <div className="w-3 h-2 rounded bg-gray-700" />
          <span className="text-gray-600 text-[9px]">0%</span>
          <div className="w-3 h-2 rounded bg-green-500" />
          <span className="text-gray-600 text-[9px]">{"> +4%"}</span>
        </div>
      </div>
    </div>
  );
}
