"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type Quote = { symbol: string; price: number; changePercent: number };

const DEFAULT_PORTFOLIO = [
  { symbol: "QQQ", shares: 5, avgPrice: 600, currency: "USD" },
  { symbol: "VOO", shares: 7, avgPrice: 629, currency: "USD" },
  { symbol: "SOFI", shares: 18, avgPrice: 18.73, currency: "USD" },
];

export default function WidgetPage() {
  const [totalUSD, setTotalUSD] = useState<number | null>(null);
  const [pnlPct, setPnlPct] = useState<number | null>(null);
  const [forex, setForex] = useState(3.65);
  const [topMover, setTopMover] = useState<{ symbol: string; pct: number } | null>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    // Load portfolio from localStorage
    let portfolio = DEFAULT_PORTFOLIO as Array<{ symbol: string; shares: number; avgPrice: number; currency?: string; manualPrice?: number }>;
    try {
      const s = JSON.parse(localStorage.getItem("app_state") ?? "{}");
      if (s.portfolio?.length) portfolio = s.portfolio;
    } catch {}

    const symbols = portfolio.map(p => p.symbol);
    Promise.all([
      fetch(`/api/stocks?symbols=${symbols.join(",")}`).then(r => r.json()),
      fetch("/api/forex").then(r => r.json()),
    ]).then(([qs, fx]: [Quote[], { rate?: number }]) => {
      const rate = fx.rate ?? 3.65;
      setForex(rate);
      const map: Record<string, Quote> = {};
      qs.forEach(q => { map[q.symbol] = q; });

      let total = 0, cost = 0;
      portfolio.forEach(item => {
        const p = item.manualPrice ?? map[item.symbol]?.price ?? 0;
        const val = p * item.shares;
        total += item.currency === "ILS" ? val / rate : val;
        cost += item.currency === "ILS" ? (item.avgPrice * item.shares) / rate : item.avgPrice * item.shares;
      });

      setTotalUSD(total);
      if (cost > 0) setPnlPct(((total - cost) / cost) * 100);

      const mover = portfolio
        .filter(p => map[p.symbol])
        .sort((a, b) => Math.abs(map[b.symbol]?.changePercent ?? 0) - Math.abs(map[a.symbol]?.changePercent ?? 0))[0];
      if (mover) setTopMover({ symbol: mover.symbol, pct: map[mover.symbol].changePercent });
    }).catch(() => {});

    const update = () => setTime(new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const isUp = (pnlPct ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-[#090c14] flex items-center justify-center p-4">
      <div className="w-full max-w-[200px] bg-[#0f1320] rounded-3xl p-5 border border-white/8 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-brand-accent text-xs font-bold tracking-wide">STOCKLY</span>
          <span className="text-gray-600 text-[10px]">{time}</span>
        </div>

        {totalUSD !== null ? (
          <>
            <p className="text-white text-2xl font-bold tracking-tight">
              ${totalUSD.toLocaleString("en", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              ≈ ₪{(totalUSD * forex).toLocaleString("he", { maximumFractionDigits: 0 })}
            </p>

            {pnlPct !== null && (
              <div className={`flex items-center gap-1 mt-2 ${isUp ? "text-brand-green" : "text-brand-red"}`}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span className="text-sm font-bold">
                  {isUp ? "+" : ""}{pnlPct.toFixed(1)}%
                </span>
              </div>
            )}

            {topMover && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-gray-600 text-[9px] mb-0.5">TOP MOVER</p>
                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-bold">{topMover.symbol}</span>
                  <span className={`text-xs font-bold ${topMover.pct >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                    {topMover.pct >= 0 ? "▲" : "▼"}{Math.abs(topMover.pct).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="shimmer h-7 w-28 rounded-lg" />
            <div className="shimmer h-3 w-16 rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
