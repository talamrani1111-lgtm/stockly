"use client";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import { Search, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

type SearchResult = { symbol: string; name: string };
type PriceTarget = {
  targetMean: number; targetHigh: number; targetLow: number;
  recommendation: string | null; numberOfAnalysts: number | null;
  breakdown: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  actions: { firm: string; toGrade: string; fromGrade: string; action: string; date: string }[];
  trend: { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }[];
};

const TV_SYMBOLS: Record<string, string> = {
  "VOO": "AMEX:VOO", "QQQ": "NASDAQ:QQQ", "SOFI": "NASDAQ:SOFI",
  "TA-125": "TVC:TA125", "NVDA": "NASDAQ:NVDA", "AAPL": "NASDAQ:AAPL",
  "MSFT": "NASDAQ:MSFT", "GOOGL": "NASDAQ:GOOGL", "META": "NASDAQ:META",
  "AMZN": "NASDAQ:AMZN", "TSLA": "NASDAQ:TSLA", "PLTR": "NASDAQ:PLTR",
  "RKLB": "NASDAQ:RKLB", "AMD": "NASDAQ:AMD", "INTC": "NASDAQ:INTC",
  "SPY": "AMEX:SPY", "VTI": "AMEX:VTI", "GLD": "AMEX:GLD",
};
function getTVSymbol(s: string) { return TV_SYMBOLS[s.toUpperCase()] ?? `NASDAQ:${s}`; }

declare global { interface Window { TradingView: { widget: new (c: object) => void } } }

type Timeframe = { label: string; interval: string; range: string };
const TIMEFRAMES: Timeframe[] = [
  { label: "1D", interval: "5",  range: "1D"  },
  { label: "5D", interval: "15", range: "5D"  },
  { label: "1M", interval: "D",  range: "1M"  },
  { label: "3M", interval: "D",  range: "3M"  },
  { label: "6M", interval: "W",  range: "6M"  },
  { label: "1Y", interval: "W",  range: "12M" },
  { label: "2Y", interval: "W",  range: "24M" },
];

const REC_LABELS: Record<string, { he: string; en: string; color: string; bg: string }> = {
  strong_buy: { he: "קנייה חזקה", en: "Strong Buy", color: "text-brand-green",  bg: "bg-brand-green/15"  },
  buy:        { he: "קנייה",      en: "Buy",         color: "text-green-400",    bg: "bg-green-400/15"    },
  hold:       { he: "החזק",       en: "Hold",        color: "text-brand-yellow", bg: "bg-brand-yellow/15" },
  sell:       { he: "מכירה",      en: "Sell",        color: "text-brand-red",    bg: "bg-brand-red/15"    },
  strong_sell:{ he: "מכירה חזקה", en: "Strong Sell", color: "text-brand-red",    bg: "bg-brand-red/15"    },
};

const ACTION_LABELS: Record<string, { label: string; labelHe: string; color: string }> = {
  up:       { label: "Upgraded",   labelHe: "שדרוג",     color: "text-brand-green"  },
  down:     { label: "Downgraded", labelHe: "הורדה",     color: "text-brand-red"    },
  init:     { label: "Initiated",  labelHe: "כיסוי חדש", color: "text-brand-accent" },
  main:     { label: "Maintained", labelHe: "אישור",     color: "text-gray-400"     },
  reit:     { label: "Reiterated", labelHe: "אישור",     color: "text-gray-400"     },
};
function actionInfo(action: string) {
  return ACTION_LABELS[action.toLowerCase()] ?? { label: action, labelHe: action, color: "text-gray-400" };
}

function gradeColor(grade: string): string {
  const g = grade.toLowerCase();
  if (g.includes("strong buy") || g.includes("outperform") || g.includes("overweight") || g.includes("buy")) return "text-brand-green";
  if (g.includes("sell") || g.includes("underperform") || g.includes("underweight")) return "text-brand-red";
  return "text-brand-yellow";
}

function AnalystActions({ actions, isRTL }: { actions: PriceTarget["actions"]; isRTL: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? actions : actions.slice(0, 4);

  return (
    <div>
      <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-2">
        {isRTL ? "פעולות אחרונות — פירמות אנליסטים" : "Recent Analyst Actions"}
      </p>
      <div className="space-y-1.5">
        {shown.map((a, i) => {
          const act = actionInfo(a.action);
          return (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{a.firm}</p>
                <p className="text-gray-500 text-[10px]">{a.date}</p>
              </div>
              <div className="text-end flex-shrink-0">
                <p className={clsx("text-xs font-bold", act.color)}>
                  {isRTL ? act.labelHe : act.label}
                </p>
                <p className="text-[10px]">
                  {a.fromGrade && <span className="text-gray-500">{a.fromGrade} → </span>}
                  <span className={clsx("font-semibold", gradeColor(a.toGrade))}>{a.toGrade}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {actions.length > 4 && (
        <button onClick={() => setExpanded(!expanded)}
          className="mt-2 text-brand-accent text-xs flex items-center gap-1">
          {expanded
            ? <><ChevronUp size={12} />{isRTL ? "פחות" : "Less"}</>
            : <><ChevronDown size={12} />{isRTL ? `עוד ${actions.length - 4}` : `+${actions.length - 4} more`}</>}
        </button>
      )}
    </div>
  );
}

function TvChart({ symbol, timeframe, lang }: { symbol: string; timeframe: Timeframe; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}_${timeframe.label}`;

  useEffect(() => {
    const existing = document.getElementById(id);
    if (existing) existing.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !document.getElementById(id)) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: getTVSymbol(symbol),
        interval: timeframe.interval,
        range: timeframe.range,
        timezone: "Asia/Jerusalem",
        theme: "dark",
        style: "1",
        locale: lang === "he" ? "he_IL" : "en",
        toolbar_bg: "#0f1320",
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: true,
        withdateranges: false,
        container_id: id,
        studies: timeframe.label === "1D" || timeframe.label === "5D"
          ? ["Volume@tv-basicstudies", "RSI@tv-basicstudies"]
          : ["Volume@tv-basicstudies", "MASimple@tv-basicstudies"],
        disabled_features: ["header_symbol_search", "header_settings", "header_compare", "header_undo_redo"],
        enabled_features: ["use_localstorage_for_settings"],
      });
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [symbol, timeframe.label, lang, id]);

  return (
    <div ref={ref} className="w-full rounded-2xl overflow-hidden border border-brand-border">
      <div id={id} className="w-full" style={{ height: "calc(100dvh - 260px)", minHeight: 380 }} />
    </div>
  );
}

export default function ChartsTab() {
  const { lang, isRTL, portfolio, watchlist } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<PriceTarget | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[2]); // 1M default
  const [showAnalysts, setShowAnalysts] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  function handleInput(v: string) {
    setSearch(v.toUpperCase());
    clearTimeout(debounce.current);
    if (v.length < 1) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${v}`);
      const data: SearchResult[] = await res.json();
      setResults(data); setOpen(data.length > 0);
    }, 300);
  }

  function select(sym: string) {
    setSelected(sym); setSearch(sym); setOpen(false); setResults([]);
    setTarget(null); setShowAnalysts(false);
    fetch(`/api/price-target?symbol=${sym}`)
      .then(r => r.json())
      .then(d => { if (d.targetMean) setTarget(d); })
      .catch(() => {});
  }

  const allSymbols = [...new Set([...portfolio.map(p => p.symbol), ...watchlist])];

  const rec = target?.recommendation ? REC_LABELS[target.recommendation] : null;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="flex flex-col gap-3 -mx-4 px-4">
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5">
          <Search size={14} className="text-gray-500 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
            placeholder={isRTL ? "חפש מניה (לדוגמה NVDA, AAPL)" : "Search stock (e.g. NVDA, AAPL)"}
            value={search}
            onChange={e => handleInput(e.target.value)}
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
            {results.map(r => (
              <button key={r.symbol} onMouseDown={() => select(r.symbol)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-start">
                <span className="text-white font-bold text-sm w-16 flex-shrink-0">{r.symbol}</span>
                <span className="text-gray-400 text-xs truncate">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick symbols */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {allSymbols.map(sym => (
          <button key={sym} onClick={() => select(sym)}
            className={clsx("flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              selected === sym
                ? "bg-brand-accent border-brand-accent text-white shadow-glow"
                : "bg-white/5 border-white/8 text-gray-400 hover:text-white")}>
            {sym}
          </button>
        ))}
      </div>

      {selected ? (
        <>
          {/* Timeframe selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {TIMEFRAMES.map(tf => (
              <button key={tf.label} onClick={() => setTimeframe(tf)}
                className={clsx("flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                  timeframe.label === tf.label
                    ? "bg-brand-accent border-brand-accent text-white"
                    : "bg-white/5 border-white/8 text-gray-400 hover:text-white")}>
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <TvChart key={`${selected}-${timeframe.label}`} symbol={selected} timeframe={timeframe} lang={lang} />

          {/* Analyst panel */}
          {target && (
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              {/* Summary row */}
              <button className="w-full flex items-center gap-3 px-4 py-3"
                onClick={() => setShowAnalysts(!showAnalysts)}>
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  {rec && (
                    <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-xl flex-shrink-0", rec.color, rec.bg)}>
                      {isRTL ? rec.he : rec.en}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold">${target.targetMean?.toFixed(2)}</p>
                    <p className="text-gray-500 text-[10px]">
                      ${target.targetLow?.toFixed(0)} – ${target.targetHigh?.toFixed(0)} · {target.numberOfAnalysts} {isRTL ? "אנליסטים" : "analysts"}
                    </p>
                  </div>
                </div>
                {showAnalysts ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />}
              </button>

              {/* Expanded analyst details */}
              {showAnalysts && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
                  {/* Breakdown bars */}
                  {target.breakdown && (() => {
                    const b = target.breakdown!;
                    const total = b.strongBuy + b.buy + b.hold + b.sell + b.strongSell || 1;
                    const bars = [
                      { label: isRTL ? "קנייה חזקה" : "Strong Buy", val: b.strongBuy, color: "#22c55e" },
                      { label: isRTL ? "קנייה" : "Buy",             val: b.buy,       color: "#86efac" },
                      { label: isRTL ? "החזק" : "Hold",             val: b.hold,      color: "#f59e0b" },
                      { label: isRTL ? "מכירה" : "Sell",            val: b.sell,      color: "#f87171" },
                      { label: isRTL ? "מכירה חזקה" : "Strong Sell",val: b.strongSell,color: "#ef4444" },
                    ];
                    return (
                      <div>
                        <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-2">
                          {isRTL ? "קונצנזוס" : "Consensus"}
                        </p>
                        <div className="space-y-1.5">
                          {bars.map(({ label, val, color }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-20 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${(val / total) * 100}%`, backgroundColor: color }} />
                              </div>
                              <span className="text-[10px] font-bold w-4 text-end flex-shrink-0" style={{ color }}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Trend over time */}
                  {target.trend?.length > 1 && (
                    <div>
                      <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-2">
                        {isRTL ? "מגמה רבעונית" : "Quarterly Trend"}
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {target.trend.map(t => {
                          const total = t.strongBuy + t.buy + t.hold + t.sell + t.strongSell || 1;
                          const bullish = ((t.strongBuy + t.buy) / total) * 100;
                          return (
                            <div key={t.period} className="bg-white/5 rounded-xl p-2 text-center">
                              <p className="text-gray-500 text-[9px] mb-1">{t.period}</p>
                              <p className={clsx("text-xs font-bold", bullish > 60 ? "text-brand-green" : bullish > 40 ? "text-brand-yellow" : "text-brand-red")}>
                                {bullish.toFixed(0)}%
                              </p>
                              <p className="text-gray-600 text-[9px]">{isRTL ? "שורי" : "Bullish"}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Individual firm actions */}
                  {target.actions?.length > 0 && (
                    <AnalystActions actions={target.actions} isRTL={isRTL} />
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <TrendingUp size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">
            {isRTL ? "בחר מניה לצפייה בגרף" : "Select a stock to view chart"}
          </p>
          <p className="text-gray-600 text-xs">
            {isRTL ? "לחץ על מניה מהתיק / מעקב, או חפש כל סימול" : "Tap a stock from portfolio / watchlist, or search any symbol"}
          </p>
          {/* Popular suggestions */}
          <div className="flex gap-2 mt-5 flex-wrap justify-center">
            {["AAPL", "NVDA", "TSLA", "META", "MSFT"].map(sym => (
              <button key={sym} onClick={() => select(sym)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/8 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                {sym}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
