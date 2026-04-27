"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp, Clock } from "lucide-react";
import { useApp } from "@/lib/context";
import StockDetailSheet from "./StockDetailSheet";

type Result = { symbol: string; name: string };

const POPULAR = ["NVDA", "AAPL", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "SPY", "QQQ"];

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { isRTL, portfolio, alerts, setAlerts } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const r = JSON.parse(localStorage.getItem("search_recent") ?? "[]");
      setRecent(r);
    } catch {}
  }, []);

  function addRecent(sym: string) {
    const updated = [sym, ...recent.filter(s => s !== sym)].slice(0, 6);
    setRecent(updated);
    localStorage.setItem("search_recent", JSON.stringify(updated));
  }

  function handleInput(v: string) {
    setQuery(v.toUpperCase());
    clearTimeout(debounce.current);
    if (!v) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${v}`);
        const data: Result[] = await res.json();
        setResults(data);
      } catch {}
      setLoading(false);
    }, 300);
  }

  function select(sym: string) {
    addRecent(sym);
    setSelected(sym);
  }

  if (selected) {
    return (
      <StockDetailSheet
        symbol={selected}
        quote={null}
        forex={3.65}
        portfolioItem={portfolio.find(p => p.symbol === selected)}
        onClose={() => { setSelected(null); }}
        onSetAlert={(sym, price, dir) => {
          const newAlert = { id: `${sym}_${Date.now()}`, symbol: sym, targetPrice: price, direction: dir, triggered: false, createdAt: Date.now() };
          setAlerts([...alerts.filter(a => !(a.symbol === sym && a.direction === dir)), newAlert]);
        }}
      />
    );
  }

  const showList = query ? results : (recent.length ? recent.map(s => ({ symbol: s, name: "" })) : POPULAR.map(s => ({ symbol: s, name: "" })));
  const listTitle = query ? null : recent.length
    ? (isRTL ? "חיפושים אחרונים" : "Recent")
    : (isRTL ? "מניות פופולריות" : "Popular");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-bg" dir={isRTL ? "rtl" : "ltr"}>
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-surface pt-safe">
        <Search size={16} className="text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-white text-base placeholder-gray-600 focus:outline-none"
          placeholder={isRTL ? "חפש מניה, ETF..." : "Search stock, ETF..."}
          value={query}
          onChange={e => handleInput(e.target.value)}
        />
        {loading && <div className="w-4 h-4 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {listTitle && (
          <div className="flex items-center gap-2 mb-3">
            {recent.length > 0 ? <Clock size={12} className="text-gray-600" /> : <TrendingUp size={12} className="text-gray-600" />}
            <span className="text-gray-600 text-xs font-medium">{listTitle}</span>
          </div>
        )}

        <div className="space-y-1">
          {showList.map((r, i) => (
            <button key={i} onClick={() => select(r.symbol)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-start">
              <div className="w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-accent text-xs font-bold">{r.symbol.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{r.symbol}</p>
                {r.name && <p className="text-gray-500 text-xs truncate">{r.name}</p>}
              </div>
              {portfolio.find(p => p.symbol === r.symbol) && (
                <span className="text-brand-accent text-[10px] bg-brand-accent/10 px-2 py-0.5 rounded-lg flex-shrink-0">
                  {isRTL ? "בתיק" : "Owned"}
                </span>
              )}
            </button>
          ))}
        </div>

        {query && !loading && results.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-12">
            {isRTL ? `לא נמצאו תוצאות עבור "${query}"` : `No results for "${query}"`}
          </p>
        )}
      </div>
    </div>
  );
}
