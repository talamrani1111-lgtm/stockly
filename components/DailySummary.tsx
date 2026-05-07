"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { TrendingUp, TrendingDown, Newspaper, RefreshCw } from "lucide-react";
import clsx from "clsx";

function FearGreedWidget({ isRTL }: { isRTL: boolean }) {
  const [vix, setVix] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stocks?symbols=VIX").then(r => r.json())
      .then((d: { price: number }[]) => { if (d[0]?.price) setVix(d[0].price); })
      .catch(() => {});
  }, []);

  if (!vix) return null;

  const score = vix >= 40 ? 8 : vix >= 30 ? 22 : vix >= 25 ? 38 : vix >= 20 ? 52 : vix >= 15 ? 68 : vix >= 12 ? 82 : 92;
  const { label, color, bg } = score >= 75 ? { label: isRTL ? "חמדנות קיצונית" : "Extreme Greed", color: "text-brand-green", bg: "bg-brand-green/10" }
    : score >= 55 ? { label: isRTL ? "חמדנות" : "Greed", color: "text-green-400", bg: "bg-green-400/10" }
    : score >= 45 ? { label: isRTL ? "נייטרל" : "Neutral", color: "text-gray-300", bg: "bg-white/5" }
    : score >= 25 ? { label: isRTL ? "פחד" : "Fear", color: "text-brand-yellow", bg: "bg-brand-yellow/10" }
    : { label: isRTL ? "פחד קיצוני" : "Extreme Fear", color: "text-brand-red", bg: "bg-brand-red/10" };

  const pct = score;
  const gradientColor = score >= 55 ? "#22c55e" : score >= 45 ? "#9ca3af" : score >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className={clsx("rounded-2xl p-4 border border-white/8 mb-4", bg)}>
      <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-3">
        {isRTL ? "מד פחד וחמדנות" : "Fear & Greed Index"}
      </p>
      <div className="flex items-center gap-4">
        {/* Arc gauge */}
        <div className="relative flex-shrink-0" style={{ width: 72, height: 40 }}>
          <svg width="72" height="40" viewBox="0 0 72 40">
            <path d="M 6 36 A 30 30 0 0 1 66 36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 6 36 A 30 30 0 0 1 66 36" fill="none" stroke={gradientColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 94.25} 94.25`} />
          </svg>
          <p className={clsx("absolute bottom-0 left-0 right-0 text-center text-base font-bold", color)}>{score}</p>
        </div>
        <div>
          <p className={clsx("text-base font-bold", color)}>{label}</p>
          <p className="text-gray-500 text-xs mt-0.5">VIX {vix.toFixed(1)} · {isRTL ? "מבוסס תנודתיות" : "Volatility-based"}</p>
        </div>
      </div>
    </div>
  );
}

type Quote = { symbol: string; price: number; change: number; changePercent: number; high: number; low: number };
type NewsItem = { headline: string; url: string; source: string; datetime: number };
type SymbolDay = {
  symbol: string;
  quote: Quote | null;
  news: NewsItem[];
};

export default function DailySummary() {
  const { portfolio, isRTL } = useApp();
  const [data, setData] = useState<SymbolDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const symbols = portfolio.filter(p => !p.manualPrice && p.currency !== "ILS").map(p => p.symbol);

  async function load() {
    if (!symbols.length) { setLoading(false); return; }
    try {
      const quotesRes = await fetch(`/api/stocks?symbols=${symbols.join(",")}`);
      const quotes: Quote[] = await quotesRes.json();
      const quoteMap: Record<string, Quote> = {};
      quotes.forEach(q => { quoteMap[q.symbol] = q; });

      const today = new Date();
      const from = today.toISOString().slice(0, 10);
      const to = from;

      const newsResults = await Promise.all(
        symbols.map(sym =>
          fetch(`/api/news?symbols=${sym}`)
            .then(r => r.json())
            .then(d => ({ sym, news: Array.isArray(d) ? d.slice(0, 2) : [] }))
            .catch(() => ({ sym, news: [] }))
        )
      );

      const result: SymbolDay[] = symbols.map(sym => ({
        symbol: sym,
        quote: quoteMap[sym] ?? null,
        news: newsResults.find(n => n.sym === sym)?.news ?? [],
      }));

      // Sort by absolute change (biggest movers first)
      result.sort((a, b) => Math.abs(b.quote?.changePercent ?? 0) - Math.abs(a.quote?.changePercent ?? 0));
      setData(result);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function refresh() {
    setRefreshing(true);
    await load();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-brand-card border border-brand-border rounded-2xl p-4">
            <div className="shimmer h-4 w-16 mb-3" />
            <div className="shimmer h-3 w-full mb-2" />
            <div className="shimmer h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  // Compute total daily P&L
  const totalDailyPnL = data.reduce((sum, { symbol, quote }) => {
    const item = portfolio.find(p => p.symbol === symbol);
    if (!quote || !item) return sum;
    return sum + quote.change * item.shares;
  }, 0);
  const totalDailyPct = data.length > 0
    ? data.reduce((sum, { quote }) => sum + (quote?.changePercent ?? 0), 0) / data.length
    : 0;

  function techLabel(quote: Quote | null, isRTL: boolean): { label: string; color: string } {
    if (!quote) return { label: "", color: "" };
    const dayRange = quote.high - quote.low;
    const pos = dayRange > 0 ? ((quote.price - quote.low) / dayRange) * 100 : 50;
    if (pos >= 80) return { label: isRTL ? "ליד שיא יומי 🔝" : "Near day high 🔝", color: "text-brand-green" };
    if (pos <= 20) return { label: isRTL ? "ליד שפל יומי ⚠️" : "Near day low ⚠️", color: "text-brand-red" };
    if (Math.abs(quote.changePercent) > 3) return { label: isRTL ? "תנודה חריגה 🔥" : "Unusual move 🔥", color: "text-brand-yellow" };
    return { label: isRTL ? "מסחר רגיל" : "Normal trading", color: "text-gray-400" };
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <FearGreedWidget isRTL={isRTL} />

      {/* Total daily P&L banner */}
      {data.length > 0 && !loading && (
        <div className={clsx(
          "rounded-2xl border p-4 mb-4",
          totalDailyPnL >= 0 ? "bg-green-gradient border-brand-green/20" : "bg-red-gradient border-brand-red/20"
        )}>
          <p className="text-gray-400 text-xs mb-1">{isRTL ? "סה\"כ שינוי יומי בתיק" : "Total portfolio daily change"}</p>
          <div className="flex items-end gap-3">
            <span className={clsx("text-2xl font-bold", totalDailyPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
              {totalDailyPnL >= 0 ? "+" : ""}${Math.abs(totalDailyPnL).toFixed(0)}
            </span>
            <span className={clsx("text-sm font-semibold mb-0.5 opacity-80", totalDailyPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
              ({totalDailyPct >= 0 ? "+" : ""}{totalDailyPct.toFixed(2)}% ממוצע)
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-base">
          {isRTL ? "מה קרה היום" : "What Happened Today"}
        </h2>
        <button onClick={refresh} className={clsx("text-gray-500 hover:text-white transition-colors", refreshing && "animate-spin")}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {data.map(({ symbol, quote, news }) => {
          const up = (quote?.changePercent ?? 0) >= 0;
          const portfolioItem = portfolio.find(p => p.symbol === symbol);
          const pnlDay = quote && portfolioItem
            ? quote.change * portfolioItem.shares
            : null;
          const tech = techLabel(quote, isRTL);

          return (
            <div key={symbol} className={clsx(
              "rounded-2xl p-4 border",
              up ? "bg-green-gradient border-brand-green/20" : "bg-red-gradient border-brand-red/20"
            )}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={clsx("w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0",
                    up ? "bg-brand-green/20" : "bg-brand-red/20")}>
                    {up ? <TrendingUp size={14} className="text-brand-green" /> : <TrendingDown size={14} className="text-brand-red" />}
                  </span>
                  <div>
                    <span className="text-white font-bold text-sm">{symbol}</span>
                    {quote && (
                      <p className="text-gray-400 text-xs">${quote.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                <div className="text-end">
                  {quote && (
                    <p className={clsx("text-base font-bold", up ? "text-brand-green" : "text-brand-red")}>
                      {up ? "▲" : "▼"} {Math.abs(quote.changePercent).toFixed(2)}%
                    </p>
                  )}
                  {pnlDay !== null && (
                    <p className={clsx("text-xs font-semibold", pnlDay >= 0 ? "text-brand-green" : "text-brand-red")}>
                      {pnlDay >= 0 ? "+" : ""}${Math.abs(pnlDay).toFixed(0)} {isRTL ? "היום" : "today"}
                    </p>
                  )}
                </div>
              </div>

              {/* Day range + technical */}
              {quote && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-500 text-[10px]">
                      ${quote.low.toFixed(2)} – ${quote.high.toFixed(2)}
                    </span>
                    {tech.label && (
                      <span className={clsx("text-[10px] font-semibold", tech.color)}>{tech.label}</span>
                    )}
                  </div>
                  {(() => {
                    const range = quote.high - quote.low;
                    const pos = range > 0 ? ((quote.price - quote.low) / range) * 100 : 50;
                    return (
                      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${pos}%`, background: up ? "#22c55e" : "#ef4444" }} />
                        <div className="absolute inset-y-0 w-0.5 bg-white rounded-full"
                          style={{ left: `${Math.min(99, pos)}%` }} />
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* News */}
              {news.length > 0 && (
                <div className="border-t border-white/5 pt-2.5 space-y-2">
                  {news.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-2 group">
                      <Newspaper size={11} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400 text-[11px] line-clamp-2 group-hover:text-gray-200 transition-colors leading-4">
                        {item.headline}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {news.length === 0 && (
                <p className="text-gray-600 text-[11px] border-t border-white/5 pt-2.5">
                  {isRTL ? "אין חדשות ספציפיות היום" : "No specific news today"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
