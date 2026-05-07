"use client";
import { useApp, PortfolioItem } from "@/lib/context";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";

type Quote = { price: number; changePercent: number };

type Props = { quotes: Record<string, Quote>; forex: number };

function effectivePrice(item: PortfolioItem, quotes: Record<string, Quote>): number {
  if (item.manualPrice && item.manualPrice > 0) return item.manualPrice;
  return quotes[item.symbol]?.price ?? 0;
}

export default function RebalancingSuggestions({ quotes, forex }: Props) {
  const { portfolio, isRTL, lang } = useApp();

  if (portfolio.length < 2 || !Object.keys(quotes).length) return null;

  const totalUSD = portfolio.reduce((sum, item) => {
    const p = effectivePrice(item, quotes);
    const val = p * item.shares;
    return sum + (item.currency === "ILS" ? val / forex : val);
  }, 0);

  if (totalUSD <= 0) return null;

  const items = portfolio.map(item => {
    const p = effectivePrice(item, quotes);
    const val = p * item.shares;
    const valUSD = item.currency === "ILS" ? val / forex : val;
    return { symbol: item.symbol, valUSD, weight: (valUSD / totalUSD) * 100 };
  }).sort((a, b) => b.weight - a.weight);

  const suggestions: { symbol: string; type: "overweight" | "underweight" | "concentrated"; weight: number }[] = [];

  items.forEach(item => {
    if (item.weight > 40) suggestions.push({ ...item, type: "concentrated" });
    else if (item.weight > 25) suggestions.push({ ...item, type: "overweight" });
  });

  // Check overall diversification
  const topThreeWeight = items.slice(0, 3).reduce((s, i) => s + i.weight, 0);

  if (!suggestions.length && topThreeWeight < 80) return null;

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-brand-yellow" />
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
          {lang === "he" ? "ריבלנסינג" : "Rebalancing"}
        </p>
      </div>

      <div className="space-y-2">
        {suggestions.map(s => (
          <div key={s.symbol} className={clsx(
            "flex items-center gap-3 rounded-xl p-3",
            s.type === "concentrated" ? "bg-brand-red/8 border border-brand-red/20" : "bg-brand-yellow/8 border border-brand-yellow/20"
          )}>
            {s.type === "concentrated"
              ? <TrendingUp size={14} className="text-brand-red flex-shrink-0" />
              : <TrendingDown size={14} className="text-brand-yellow flex-shrink-0" />}
            <div className="flex-1">
              <p className={clsx("text-sm font-bold", s.type === "concentrated" ? "text-brand-red" : "text-brand-yellow")}>
                {s.symbol} — {s.weight.toFixed(0)}%
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {s.type === "concentrated"
                  ? (lang === "he" ? "ריכוז גבוה מאוד — שקול פיזור" : "Very concentrated — consider diversifying")
                  : (lang === "he" ? "משקל גבוה — שקול להפחית" : "Overweight — consider reducing")}
              </p>
            </div>
          </div>
        ))}

        {topThreeWeight >= 80 && suggestions.length === 0 && (
          <div className="bg-brand-yellow/8 border border-brand-yellow/20 rounded-xl p-3">
            <p className="text-brand-yellow text-sm font-bold">
              {lang === "he" ? `3 מניות = ${topThreeWeight.toFixed(0)}% מהתיק` : `3 stocks = ${topThreeWeight.toFixed(0)}% of portfolio`}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {lang === "he" ? "פיזור נמוך — שקול להוסיף מניות נוספות" : "Low diversification — consider adding more positions"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
