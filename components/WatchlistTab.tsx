"use client";
import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/lib/context";
import { Plus, X, TrendingUp, TrendingDown, Flame, RefreshCw } from "lucide-react";
import clsx from "clsx";

type Quote = { symbol: string; price: number; change: number; changePercent: number };
type Target = { targetMean: number; numberOfAnalysts: number | null };

function Week52Bar({ low, high, price }: { low: number; high: number; price: number }) {
  if (!low || !high || low >= high) return null;
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  const color = pct > 80 ? "#22c55e" : pct > 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="mt-1.5">
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        <div className="absolute inset-y-0 w-0.5 bg-white rounded-full" style={{ left: `${Math.min(99, pct)}%` }} />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-gray-700 text-[9px]">${low.toFixed(0)}</span>
        <span className="text-gray-600 text-[9px]">52W</span>
        <span className="text-gray-700 text-[9px]">${high.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function WatchlistTab() {
  const { watchlist, setWatchlist, portfolio, setPortfolio, isRTL } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [targets, setTargets] = useState<Record<string, Target>>({});
  const [week52, setWeek52] = useState<Record<string, { high: number; low: number }>>({});
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!watchlist.length) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks?symbols=${watchlist.join(",")}`);
      const data: Quote[] = await res.json();
      const map: Record<string, Quote> = {};
      data.forEach(q => { map[q.symbol] = q; });
      setQuotes(map);

      // Fetch targets + 52W for non-ILS symbols
      Promise.all(watchlist.map(sym =>
        fetch(`/api/stock-info?symbol=${sym}`).then(r => r.json())
          .then(d => ({ sym, high: d.fiftyTwoWeekHigh, low: d.fiftyTwoWeekLow }))
          .catch(() => null)
      )).then(results => {
        const w52: Record<string, { high: number; low: number }> = {};
        results.forEach(r => { if (r && r.high) w52[r.sym] = { high: r.high, low: r.low }; });
        setWeek52(w52);
      });

      Promise.all(watchlist.map(sym =>
        fetch(`/api/price-target?symbol=${sym}`).then(r => r.json())
          .then(d => ({ sym, data: d })).catch(() => null)
      )).then(results => {
        const tmap: Record<string, Target> = {};
        results.forEach(r => { if (r && r.data?.targetMean > 0) tmap[r.sym] = r.data; });
        setTargets(tmap);
      });
    } catch {}
    setLoading(false);
  }, [watchlist.join(",")]); // eslint-disable-line

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function addToWatchlist() {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || watchlist.includes(sym)) return;
    setWatchlist([...watchlist, sym]);
    setNewSymbol(""); setAdding(false);
  }

  function removeFromWatchlist(sym: string) {
    setWatchlist(watchlist.filter(s => s !== sym));
  }

  function addToPortfolio(sym: string) {
    if (portfolio.find(p => p.symbol === sym)) return;
    setPortfolio([...portfolio, { symbol: sym, shares: 0, avgPrice: 0, currency: "USD" }]);
  }

  const sorted = [...watchlist].sort((a, b) => {
    const pa = Math.abs(quotes[a]?.changePercent ?? 0);
    const pb = Math.abs(quotes[b]?.changePercent ?? 0);
    return pb - pa;
  });

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? "רשימת מעקב" : "Watchlist"}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll}
            className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={12} />
          </button>
          <button onClick={() => setAdding(!adding)}
            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              adding ? "bg-brand-accent/20 border-brand-accent/40 text-brand-accent"
                     : "bg-white/5 border-white/8 text-gray-400 hover:text-white")}>
            <Plus size={11} />
            {isRTL ? "הוסף" : "Add"}
          </button>
        </div>
      </div>

      {adding && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-3 mb-4 flex gap-2">
          <input
            className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
            placeholder={isRTL ? "סימול (לדוגמה AAPL)" : "Symbol (e.g. AAPL)"}
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && addToWatchlist()}
            autoFocus
          />
          <button onClick={addToWatchlist}
            className="px-4 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            {isRTL ? "הוסף" : "Add"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-brand-card border border-brand-border rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="shimmer w-9 h-9 rounded-xl" />
                <div><div className="shimmer w-14 h-4 mb-1 rounded" /><div className="shimmer w-20 h-3 rounded" /></div>
              </div>
              <div className="shimmer w-14 h-8 rounded" />
            </div>
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
            <TrendingUp size={22} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">
            {isRTL ? "רשימת המעקב ריקה" : "Your watchlist is empty"}
          </p>
          <p className="text-gray-600 text-xs">
            {isRTL ? "הוסף מניות כדי לעקוב אחריהן" : "Add symbols to track them here"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(sym => {
            const q = quotes[sym];
            const t = targets[sym];
            const w = week52[sym];
            const isUp = (q?.changePercent ?? 0) >= 0;
            const isHot = Math.abs(q?.changePercent ?? 0) > 3;
            const inPortfolio = portfolio.some(p => p.symbol === sym);
            const upside = t?.targetMean && q?.price ? ((t.targetMean - q.price) / q.price) * 100 : null;

            return (
              <div key={sym} className={clsx(
                "rounded-2xl px-4 py-3 border transition-all",
                isUp ? "bg-brand-card border-brand-green/10" : "bg-brand-card border-brand-red/10"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      isUp ? "bg-brand-green/10" : "bg-brand-red/10")}>
                      {isHot
                        ? <Flame size={15} className={isUp ? "text-brand-green" : "text-brand-red"} />
                        : isUp ? <TrendingUp size={15} className="text-brand-green" />
                               : <TrendingDown size={15} className="text-brand-red" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-bold text-sm">{sym}</p>
                        {inPortfolio && (
                          <span className="text-[9px] bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded-lg">
                            {isRTL ? "בתיק" : "Owned"}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">{q ? `$${q.price.toFixed(2)}` : "—"}</p>
                      {w && q && <Week52Bar low={w.low} high={w.high} price={q.price} />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-end">
                      {q && (
                        <p className={clsx("font-bold text-sm", isUp ? "text-brand-green" : "text-brand-red")}>
                          {isUp ? "+" : ""}{q.changePercent.toFixed(2)}%
                        </p>
                      )}
                      {upside !== null && (
                        <p className={clsx("text-[10px] font-semibold", upside > 0 ? "text-brand-green/80" : "text-brand-red/80")}>
                          {isRTL ? "יעד:" : "Target:"} {upside > 0 ? "+" : ""}{upside.toFixed(0)}%
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {!inPortfolio && (
                        <button onClick={() => addToPortfolio(sym)}
                          className="w-6 h-6 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent hover:bg-brand-accent/30 transition-colors"
                          title={isRTL ? "הוסף לתיק" : "Add to portfolio"}>
                          <Plus size={11} />
                        </button>
                      )}
                      <button onClick={() => removeFromWatchlist(sym)}
                        className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-brand-red hover:bg-brand-red/20 transition-colors">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
