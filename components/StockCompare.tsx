"use client";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { GitCompare, X, TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

type StockData = {
  symbol: string;
  price: number;
  changePercent: number;
  high: number;
  low: number;
  marketCap?: number;
  pe?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
};

const PRESETS = ["NVDA", "AAPL", "MSFT", "TSLA", "META", "AMZN", "GOOGL", "AMD", "VOO", "QQQ"];

async function fetchStock(symbol: string): Promise<StockData | null> {
  try {
    const [quoteRes, infoRes] = await Promise.all([
      fetch(`/api/stocks?symbols=${symbol}`),
      fetch(`/api/stock-info?symbol=${symbol}`),
    ]);
    const quotes = await quoteRes.json();
    const info = await infoRes.json();
    const q = quotes[0];
    if (!q) return null;
    return {
      symbol,
      price: q.price,
      changePercent: q.changePercent,
      high: q.high,
      low: q.low,
      marketCap: info.marketCap,
      pe: info.peRatio,
      beta: info.beta,
      week52High: info.fiftyTwoWeekHigh,
      week52Low: info.fiftyTwoWeekLow,
    };
  } catch { return null; }
}

function fmt(n?: number | null, prefix = "", suffix = "", decimals = 2): string {
  if (n == null) return "—";
  if (prefix === "$" && n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (prefix === "$" && n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `${prefix}${n.toFixed(decimals)}${suffix}`;
}

export default function StockCompare() {
  const { lang, isRTL } = useApp();
  const [sym1, setSym1] = useState("NVDA");
  const [sym2, setSym2] = useState("AMD");
  const [data1, setData1] = useState<StockData | null>(null);
  const [data2, setData2] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);

  async function compare() {
    setLoading(true);
    setCompared(false);
    const [d1, d2] = await Promise.all([fetchStock(sym1.toUpperCase()), fetchStock(sym2.toUpperCase())]);
    setData1(d1);
    setData2(d2);
    setLoading(false);
    setCompared(true);
  }

  type RowDef = { label: { he: string; en: string }; v1: string; v2: string; winner?: "left" | "right" | null };

  function rows(): RowDef[] {
    if (!data1 || !data2) return [];
    const better = (a: number | undefined | null, b: number | undefined | null, higherIsBetter = true): "left" | "right" | null => {
      if (a == null || b == null) return null;
      return higherIsBetter ? (a > b ? "left" : a < b ? "right" : null) : (a < b ? "left" : a > b ? "right" : null);
    };
    return [
      { label: { he: "מחיר", en: "Price" }, v1: fmt(data1.price, "$"), v2: fmt(data2.price, "$"), winner: null },
      { label: { he: "שינוי היום", en: "Today %" }, v1: fmt(data1.changePercent, "", "%"), v2: fmt(data2.changePercent, "", "%"), winner: better(data1.changePercent, data2.changePercent) },
      { label: { he: "שיא 52 שבוע", en: "52W High" }, v1: fmt(data1.week52High, "$"), v2: fmt(data2.week52High, "$"), winner: null },
      { label: { he: "שפל 52 שבוע", en: "52W Low" }, v1: fmt(data1.week52Low, "$"), v2: fmt(data2.week52Low, "$"), winner: null },
      { label: { he: "שווי שוק", en: "Market Cap" }, v1: fmt(data1.marketCap, "$"), v2: fmt(data2.marketCap, "$"), winner: better(data1.marketCap, data2.marketCap) },
      { label: { he: "P/E", en: "P/E" }, v1: fmt(data1.pe, "", "", 1), v2: fmt(data2.pe, "", "", 1), winner: better(data1.pe, data2.pe, false) },
      { label: { he: "Beta", en: "Beta" }, v1: fmt(data1.beta, "", "", 2), v2: fmt(data2.beta, "", "", 2), winner: better(data1.beta, data2.beta, false) },
    ];
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-4">
        <GitCompare size={15} className="text-brand-accent" />
        <p className="text-white text-sm font-semibold">
          {lang === "he" ? "השוואת מניות" : "Stock Comparison"}
        </p>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-2 mb-3">
        <input value={sym1} onChange={e => setSym1(e.target.value.toUpperCase())}
          className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white text-sm text-center font-bold uppercase focus:outline-none focus:border-brand-accent" maxLength={6} />
        <span className="text-gray-500 font-bold">vs</span>
        <input value={sym2} onChange={e => setSym2(e.target.value.toUpperCase())}
          className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white text-sm text-center font-bold uppercase focus:outline-none focus:border-brand-accent" maxLength={6} />
        <button onClick={compare} disabled={loading || !sym1 || !sym2}
          className="bg-brand-accent text-black font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0">
          {loading ? "..." : (lang === "he" ? "השווה" : "Go")}
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {PRESETS.map(s => (
          <button key={s} onClick={() => { if (!sym1 || sym1 === sym2) setSym1(s); else setSym2(s); }}
            className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg px-2 py-1 transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Results */}
      {compared && data1 && data2 && (
        <div>
          {/* Headers */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            <div className="col-span-1" />
            <div className="text-center">
              <span className="text-brand-accent font-bold text-sm">{data1.symbol}</span>
            </div>
            <div className="text-center">
              <span className="text-white font-bold text-sm">{data2.symbol}</span>
            </div>
          </div>

          {rows().map((row, i) => (
            <div key={i} className={clsx("grid grid-cols-3 gap-1 py-2", i < rows().length - 1 && "border-b border-brand-border/50")}>
              <span className="text-gray-500 text-[10px] font-semibold self-center">{row.label[lang]}</span>
              <div className={clsx("text-center rounded-lg py-1", row.winner === "left" && "bg-brand-green/15")}>
                <span className={clsx("text-xs font-bold", row.winner === "left" ? "text-brand-green" : "text-gray-300")}>
                  {row.winner === "left" && "✓ "}{row.v1}
                </span>
              </div>
              <div className={clsx("text-center rounded-lg py-1", row.winner === "right" && "bg-brand-green/15")}>
                <span className={clsx("text-xs font-bold", row.winner === "right" ? "text-brand-green" : "text-gray-300")}>
                  {row.winner === "right" && "✓ "}{row.v2}
                </span>
              </div>
            </div>
          ))}

          <p className="text-gray-600 text-[9px] text-center mt-3">
            {lang === "he" ? "✓ = עדיף" : "✓ = Better value"}
          </p>
        </div>
      )}

      {compared && (!data1 || !data2) && (
        <p className="text-brand-red text-sm text-center py-3">
          {lang === "he" ? "לא נמצאו נתונים" : "No data found"}
        </p>
      )}
    </div>
  );
}
