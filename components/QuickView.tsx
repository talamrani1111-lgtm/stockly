"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import clsx from "clsx";

type Quote = { symbol: string; price: number; changePercent: number };

export default function QuickView({ onClose }: { onClose: () => void }) {
  const { portfolio, isRTL } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [forex, setForex] = useState(3.65);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbols = portfolio.map(p => p.symbol);
    if (!symbols.length) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/stocks?symbols=${symbols.join(",")}`).then(r => r.json()),
      fetch("/api/forex").then(r => r.json()),
    ]).then(([qs, fx]) => {
      const map: Record<string, Quote> = {};
      qs.forEach((q: Quote) => { map[q.symbol] = q; });
      setQuotes(map);
      if (fx.rate) setForex(fx.rate);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const totalUSD = portfolio.reduce((sum, item) => {
    const p = item.manualPrice ?? quotes[item.symbol]?.price ?? 0;
    const val = p * item.shares;
    return sum + (item.currency === "ILS" ? val / forex : val);
  }, 0);

  const totalCost = portfolio.reduce((sum, item) => {
    const cost = item.avgPrice * item.shares;
    return sum + (item.currency === "ILS" ? cost / forex : cost);
  }, 0);

  const pnl = totalUSD - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const isUp = pnl >= 0;

  const topMover = portfolio
    .filter(p => quotes[p.symbol])
    .sort((a, b) => Math.abs(quotes[b.symbol]?.changePercent ?? 0) - Math.abs(quotes[a.symbol]?.changePercent ?? 0))[0];

  return (
    <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col items-center justify-center px-6"
      dir={isRTL ? "rtl" : "ltr"}>
      <button onClick={onClose}
        className="absolute top-safe end-4 mt-4 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
        <X size={18} />
      </button>

      <div className="w-full max-w-xs space-y-5 text-center">
        {/* Total value */}
        <div>
          <p className="text-gray-500 text-sm mb-2">{isRTL ? "שווי תיק" : "Portfolio Value"}</p>
          {loading ? (
            <div className="shimmer h-16 w-48 mx-auto rounded-2xl" />
          ) : (
            <p className="text-white text-5xl font-bold tracking-tight">
              ${totalUSD.toLocaleString("en", { maximumFractionDigits: 0 })}
            </p>
          )}
          <p className="text-gray-500 text-lg mt-1">
            ≈ ₪{(totalUSD * forex).toLocaleString("he", { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* P&L */}
        {!loading && totalCost > 0 && (
          <div className={clsx(
            "rounded-3xl px-8 py-4 inline-flex items-center gap-3 mx-auto",
            isUp ? "bg-brand-green/10 border border-brand-green/20" : "bg-brand-red/10 border border-brand-red/20"
          )}>
            {isUp ? <TrendingUp size={20} className="text-brand-green" /> : <TrendingDown size={20} className="text-brand-red" />}
            <div>
              <p className={clsx("text-xl font-bold", isUp ? "text-brand-green" : "text-brand-red")}>
                {isUp ? "+" : ""}${Math.abs(pnl).toLocaleString("en", { maximumFractionDigits: 0 })}
              </p>
              <p className={clsx("text-sm font-semibold", isUp ? "text-brand-green/70" : "text-brand-red/70")}>
                {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Top mover */}
        {!loading && topMover && quotes[topMover.symbol] && (
          <div className="bg-brand-card border border-brand-border rounded-2xl px-6 py-3">
            <p className="text-gray-500 text-xs mb-1">{isRTL ? "תנועה גדולה ביותר" : "Top Mover"}</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-white font-bold text-lg">{topMover.symbol}</span>
              <span className={clsx("text-lg font-bold",
                (quotes[topMover.symbol].changePercent ?? 0) >= 0 ? "text-brand-green" : "text-brand-red")}>
                {(quotes[topMover.symbol].changePercent ?? 0) >= 0 ? "▲" : "▼"}
                {Math.abs(quotes[topMover.symbol].changePercent ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Forex */}
        <p className="text-gray-600 text-sm">
          ₪/$ {forex.toFixed(3)}
        </p>
      </div>
    </div>
  );
}
