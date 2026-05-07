"use client";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { GitCompare } from "lucide-react";
import clsx from "clsx";

type StockData = {
  symbol: string;
  price: number;
  changePercent: number;
  marketCap?: number;
  pe?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
};

async function fetchStock(symbol: string): Promise<StockData | null> {
  try {
    const [qRes, iRes] = await Promise.all([
      fetch(`/api/stocks?symbols=${symbol}`),
      fetch(`/api/stock-info?symbol=${symbol}`),
    ]);
    const quotes = await qRes.json();
    const info = await iRes.json();
    const q = Array.isArray(quotes) ? quotes[0] : null;
    if (!q) return null;
    return {
      symbol,
      price: q.price,
      changePercent: q.changePercent,
      marketCap: info.marketCap,
      pe: info.peRatio,
      beta: info.beta,
      week52High: info.fiftyTwoWeekHigh,
      week52Low: info.fiftyTwoWeekLow,
    };
  } catch { return null; }
}

function fmt(n?: number | null, prefix = "", suffix = "", dec = 2): string {
  if (n == null || isNaN(n)) return "—";
  if (prefix === "$" && n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (prefix === "$" && n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (prefix === "$" && n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `${prefix}${n.toFixed(dec)}${suffix}`;
}

const PRESETS = ["AAPL", "NVDA", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "AMD", "VOO", "QQQ"];

export default function StockCompare() {
  const { lang, isRTL } = useApp();
  const [sym1, setSym1] = useState("NVDA");
  const [sym2, setSym2] = useState("AMD");
  const [active, setActive] = useState<1 | 2>(1);
  const [data1, setData1] = useState<StockData | null>(null);
  const [data2, setData2] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);

  async function compare() {
    if (!sym1.trim() || !sym2.trim()) return;
    setLoading(true); setDone(false); setErr(false);
    const [d1, d2] = await Promise.all([
      fetchStock(sym1.trim().toUpperCase()),
      fetchStock(sym2.trim().toUpperCase()),
    ]);
    setData1(d1); setData2(d2);
    setLoading(false);
    if (d1 && d2) setDone(true); else setErr(true);
  }

  function pickPreset(s: string) {
    if (active === 1) setSym1(s); else setSym2(s);
  }

  type Row = { label: { he: string; en: string }; v1: string; v2: string; winner: "left" | "right" | null };
  function rows(): Row[] {
    if (!data1 || !data2) return [];
    const w = (a?: number | null, b?: number | null, hi = true): "left" | "right" | null => {
      if (a == null || b == null || isNaN(a) || isNaN(b)) return null;
      if (a === b) return null;
      return hi ? (a > b ? "left" : "right") : (a < b ? "left" : "right");
    };
    return [
      { label: { he: "מחיר",         en: "Price"     }, v1: fmt(data1.price, "$"),          v2: fmt(data2.price, "$"),          winner: null },
      { label: { he: "שינוי היום",   en: "Today %"   }, v1: fmt(data1.changePercent,"","%" ,2), v2: fmt(data2.changePercent,"","%",2), winner: w(data1.changePercent, data2.changePercent) },
      { label: { he: "שיא 52 שבוע", en: "52W High"  }, v1: fmt(data1.week52High, "$"),     v2: fmt(data2.week52High, "$"),     winner: null },
      { label: { he: "שפל 52 שבוע", en: "52W Low"   }, v1: fmt(data1.week52Low, "$"),      v2: fmt(data2.week52Low, "$"),      winner: null },
      { label: { he: "שווי שוק",    en: "Mkt Cap"   }, v1: fmt(data1.marketCap, "$"),      v2: fmt(data2.marketCap, "$"),      winner: w(data1.marketCap, data2.marketCap) },
      { label: { he: "P/E",          en: "P/E"       }, v1: fmt(data1.pe,"","",1),          v2: fmt(data2.pe,"","",1),          winner: w(data1.pe, data2.pe, false) },
      { label: { he: "Beta",         en: "Beta"      }, v1: fmt(data1.beta,"","",2),        v2: fmt(data2.beta,"","",2),        winner: w(data1.beta, data2.beta, false) },
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

      {/* Two symbol pickers */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {([1, 2] as const).map(n => {
          const sym = n === 1 ? sym1 : sym2;
          const set = n === 1 ? setSym1 : setSym2;
          const isAct = active === n;
          return (
            <button key={n} onClick={() => setActive(n)}
              className={clsx("rounded-xl border px-3 py-2.5 text-center font-bold text-sm transition-all",
                isAct ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-brand-border bg-brand-surface text-white")}>
              <input
                value={sym}
                onChange={e => set(e.target.value.toUpperCase())}
                onClick={e => { e.stopPropagation(); setActive(n); }}
                className="w-full bg-transparent text-center font-bold uppercase focus:outline-none"
                maxLength={6}
              />
            </button>
          );
        })}
      </div>

      {/* Preset chips */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {PRESETS.map(s => (
          <button key={s} onClick={() => pickPreset(s)}
            className={clsx("text-[10px] rounded-lg px-2 py-1 transition-colors",
              (active === 1 ? sym1 : sym2) === s
                ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/30"
                : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white")}>
            {s}
          </button>
        ))}
      </div>

      {/* Compare button */}
      <button onClick={compare} disabled={loading}
        className="w-full bg-brand-accent text-black font-bold text-sm py-3 rounded-xl disabled:opacity-40 transition-opacity hover:opacity-90 mb-4">
        {loading ? (lang === "he" ? "טוען..." : "Loading...") : (lang === "he" ? `השווה ${sym1} vs ${sym2}` : `Compare ${sym1} vs ${sym2}`)}
      </button>

      {/* Results table */}
      {done && data1 && data2 && (
        <div>
          <div className="grid grid-cols-3 gap-1 mb-3 pb-2 border-b border-brand-border">
            <div />
            <p className="text-center text-brand-accent font-bold text-sm">{data1.symbol}</p>
            <p className="text-center text-white font-bold text-sm">{data2.symbol}</p>
          </div>
          {rows().map((row, i) => (
            <div key={i} className={clsx("grid grid-cols-3 gap-1 py-2", i < rows().length - 1 && "border-b border-brand-border/40")}>
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
            {lang === "he" ? "✓ = ערך עדיף לפי המדד" : "✓ = Better metric"}
          </p>
        </div>
      )}

      {err && (
        <p className="text-brand-red text-sm text-center">{lang === "he" ? "לא נמצאו נתונים — בדוק את הסימולים" : "No data found — check symbols"}</p>
      )}
    </div>
  );
}
