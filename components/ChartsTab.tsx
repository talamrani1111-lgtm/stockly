"use client";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import { Search, X, Target } from "lucide-react";

type SearchResult = { symbol: string; name: string };
type PriceTarget = { targetMean: number; targetHigh: number; targetLow: number; recommendation: string | null; numberOfAnalysts: number | null };

const TV_SYMBOLS: Record<string, string> = {
  "VOO": "AMEX:VOO", "QQQ": "NASDAQ:QQQ", "SOFI": "NASDAQ:SOFI",
  "TA-125": "TVC:TA125", "NVDA": "NASDAQ:NVDA", "AAPL": "NASDAQ:AAPL",
  "MSFT": "NASDAQ:MSFT", "GOOGL": "NASDAQ:GOOGL", "META": "NASDAQ:META",
  "AMZN": "NASDAQ:AMZN", "TSLA": "NASDAQ:TSLA", "PLTR": "NASDAQ:PLTR",
  "RKLB": "NASDAQ:RKLB", "AMD": "NASDAQ:AMD", "INTC": "NASDAQ:INTC",
};

function getTVSymbol(s: string) {
  return TV_SYMBOLS[s.toUpperCase()] ?? `NASDAQ:${s}`;
}

declare global {
  interface Window { TradingView: { widget: new (config: object) => void }; }
}

function InlineChart({ symbol, lang }: { symbol: string; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `tv_inline_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !ref.current) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: getTVSymbol(symbol),
        interval: "D",
        timezone: "Asia/Jerusalem",
        theme: "dark",
        style: "1",
        locale: lang === "he" ? "he_IL" : "en",
        toolbar_bg: "#0f1320",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        withdateranges: true,
        container_id: id,
        studies: ["RSI@tv-basicstudies"],
        disabled_features: ["header_symbol_search"],
        enabled_features: ["use_localstorage_for_settings"],
      });
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [symbol, lang, id]);

  return (
    <div ref={ref} className="w-full rounded-2xl overflow-hidden border border-brand-border" style={{ height: "calc(100vh - 240px)" }}>
      <div id={id} className="w-full h-full" />
    </div>
  );
}

const REC_LABELS: Record<string, { he: string; en: string; color: string }> = {
  "strong_buy": { he: "קנייה חזקה", en: "Strong Buy", color: "text-brand-green" },
  "buy": { he: "קנייה", en: "Buy", color: "text-brand-green" },
  "hold": { he: "החזק", en: "Hold", color: "text-brand-yellow" },
  "sell": { he: "מכירה", en: "Sell", color: "text-brand-red" },
  "strong_sell": { he: "מכירה חזקה", en: "Strong Sell", color: "text-brand-red" },
};

export default function ChartsTab() {
  const { lang, isRTL, portfolio } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<PriceTarget | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  function handleInput(v: string) {
    setSearch(v.toUpperCase());
    clearTimeout(debounce.current);
    if (v.length < 1) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${v}`);
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    }, 300);
  }

  function select(sym: string) {
    setSelected(sym);
    setSearch(sym);
    setOpen(false);
    setResults([]);
    setTarget(null);
    fetch(`/api/price-target?symbol=${sym}`)
      .then((r) => r.json())
      .then((d) => { if (d.targetMean) setTarget(d); })
      .catch(() => {});
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5">
          <Search size={14} className="text-gray-500 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
            placeholder={isRTL ? "חפש מניה לגרף (לדוגמה NVDA)" : "Search stock for chart (e.g. NVDA)"}
            value={search}
            onChange={(e) => handleInput(e.target.value)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
          {search && (
            <button onClick={() => { setSearch(""); setResults([]); setOpen(false); setSelected(null); }}>
              <X size={13} className="text-gray-500" />
            </button>
          )}
        </div>
        {open && (
          <div className="absolute top-full start-0 end-0 z-20 mt-1 bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
            {results.map((r) => (
              <button key={r.symbol} onMouseDown={() => select(r.symbol)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-start">
                <span className="text-white font-bold text-sm w-16 flex-shrink-0">{r.symbol}</span>
                <span className="text-gray-400 text-xs truncate">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio quick-select */}
      <div className="flex flex-wrap gap-2">
        {portfolio.map((p) => (
          <button key={p.symbol} onClick={() => select(p.symbol)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selected === p.symbol
                ? "bg-brand-accent border-brand-accent text-white shadow-glow"
                : "bg-white/5 border-white/8 text-gray-400 hover:text-white"
            }`}>
            {p.symbol}
          </button>
        ))}
      </div>

      {/* Analyst target bar */}
      {selected && target && (
        <div className="flex items-center gap-3 bg-brand-card border border-brand-border rounded-2xl px-4 py-3">
          <Target size={14} className="text-brand-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-[10px] mb-0.5">{isRTL ? "יעד אנליסטים" : "Analyst Target"}{target.numberOfAnalysts ? ` (${target.numberOfAnalysts})` : ""}</p>
            <p className="text-white text-sm font-bold">
              ${target.targetMean.toFixed(2)}
              <span className="text-gray-500 text-xs font-normal ms-1.5">${target.targetLow.toFixed(0)}–${target.targetHigh.toFixed(0)}</span>
            </p>
          </div>
          {target.recommendation && REC_LABELS[target.recommendation] && (
            <span className={`text-xs font-bold ${REC_LABELS[target.recommendation].color} bg-white/5 px-2.5 py-1 rounded-xl`}>
              {isRTL ? REC_LABELS[target.recommendation].he : REC_LABELS[target.recommendation].en}
            </span>
          )}
        </div>
      )}

      {/* Chart or placeholder */}
      {selected ? (
        <InlineChart key={selected} symbol={selected} lang={lang} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Search size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">
            {isRTL ? "בחר מניה לצפייה בגרף" : "Select a stock to view chart"}
          </p>
          <p className="text-gray-600 text-xs">
            {isRTL ? "לחץ על מניה מהתיק שלך או חפש כל סימול" : "Tap a portfolio stock or search any symbol"}
          </p>
        </div>
      )}
    </div>
  );
}
