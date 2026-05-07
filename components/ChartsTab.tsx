"use client";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import StockCompare from "./StockCompare";
import { Search, X, ChevronDown, ChevronUp, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import clsx from "clsx";

type SearchResult = { symbol: string; name: string };
type AnalystAction = { firm: string; toGrade: string; fromGrade: string; action: string; date: string };
type TrendPeriod  = { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number };
type PriceTarget = {
  targetMean: number; targetHigh: number; targetLow: number;
  recommendation: string | null; numberOfAnalysts: number | null;
  breakdown: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  actions: AnalystAction[];
  trend: TrendPeriod[];
};

const TV_SYMBOLS: Record<string, string> = {
  VOO: "AMEX:VOO",   QQQ: "NASDAQ:QQQ",  SOFI: "NASDAQ:SOFI",
  "TA-125": "TVC:TA125", NVDA: "NASDAQ:NVDA", AAPL: "NASDAQ:AAPL",
  MSFT: "NASDAQ:MSFT",  GOOGL: "NASDAQ:GOOGL", META: "NASDAQ:META",
  AMZN: "NASDAQ:AMZN",  TSLA: "NASDAQ:TSLA",  PLTR: "NASDAQ:PLTR",
  RKLB: "NASDAQ:RKLB",  AMD: "NASDAQ:AMD",    INTC: "NASDAQ:INTC",
  SPY: "AMEX:SPY",   VTI: "AMEX:VTI",    GLD: "AMEX:GLD",
};
function getTVSymbol(s: string) { return TV_SYMBOLS[s.toUpperCase()] ?? `NASDAQ:${s}`; }
declare global { interface Window { TradingView: { widget: new (c: object) => void } } }

type Timeframe = { label: string; labelHe: string; interval: string; range: string };
const TIMEFRAMES: Timeframe[] = [
  { label: "1D",  labelHe: "יום",    interval: "5",  range: "1D"  },
  { label: "5D",  labelHe: "שבוע",   interval: "15", range: "5D"  },
  { label: "1M",  labelHe: "חודש",   interval: "D",  range: "1M"  },
  { label: "3M",  labelHe: "3 חו׳",  interval: "D",  range: "3M"  },
  { label: "6M",  labelHe: "חצי שנה",interval: "W",  range: "6M"  },
  { label: "1Y",  labelHe: "שנה",    interval: "W",  range: "12M" },
  { label: "2Y",  labelHe: "2 שנים", interval: "W",  range: "24M" },
];

const CONSENSUS: Record<string, { he: string; color: string; bg: string; border: string }> = {
  strong_buy: { he: "קנייה חזקה",  color: "text-brand-green",  bg: "bg-brand-green/15",  border: "border-brand-green/30"  },
  buy:        { he: "קנייה",       color: "text-green-400",    bg: "bg-green-400/15",    border: "border-green-400/30"    },
  hold:       { he: "המתנה / החזק",color: "text-brand-yellow", bg: "bg-brand-yellow/15", border: "border-brand-yellow/30" },
  sell:       { he: "מכירה",       color: "text-orange-400",   bg: "bg-orange-400/15",   border: "border-orange-400/30"   },
  strong_sell:{ he: "מכירה חזקה",  color: "text-brand-red",    bg: "bg-brand-red/15",    border: "border-brand-red/30"    },
};

function gradeToHe(grade: string): string {
  const g = (grade ?? "").toLowerCase();
  if (g === "strong buy")                                   return "קנייה חזקה";
  if (g === "buy" || g === "outperform" || g === "overweight" || g === "positive") return "קנייה";
  if (g === "hold" || g === "neutral" || g === "equal-weight" || g === "market perform") return "החזק";
  if (g === "underperform" || g === "underweight" || g === "sell") return "מכירה";
  if (g === "strong sell")                                  return "מכירה חזקה";
  return grade;
}

function gradeColor(grade: string) {
  const g = (grade ?? "").toLowerCase();
  if (g.includes("strong buy"))                              return "text-brand-green";
  if (g.includes("buy") || g.includes("outperform") || g.includes("overweight") || g.includes("positive")) return "text-green-400";
  if (g.includes("sell") || g.includes("underperform") || g.includes("underweight")) return "text-brand-red";
  return "text-brand-yellow";
}

const ACTION_HE: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  up:   { label: "שדרוג",     Icon: ArrowUpRight,   color: "text-brand-green" },
  down: { label: "הורדה",     Icon: ArrowDownRight, color: "text-brand-red"   },
  init: { label: "כיסוי חדש", Icon: TrendingUp,     color: "text-brand-accent"},
  main: { label: "אישור",     Icon: Minus,          color: "text-gray-500"    },
  reit: { label: "אישור",     Icon: Minus,          color: "text-gray-500"    },
};
function actionInfo(a: string) {
  return ACTION_HE[a.toLowerCase()] ?? { label: a, Icon: Minus, color: "text-gray-400" };
}

function AnalystPanel({ target, isRTL }: { target: PriceTarget; isRTL: boolean }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const cons = target.recommendation ? CONSENSUS[target.recommendation] : null;

  const b = target.breakdown;
  const total = b ? (b.strongBuy + b.buy + b.hold + b.sell + b.strongSell) || 1 : 1;
  const bullPct = b ? Math.round(((b.strongBuy + b.buy) / total) * 100) : 0;
  const bearPct = b ? Math.round(((b.sell + b.strongSell) / total) * 100) : 0;
  const holdPct = 100 - bullPct - bearPct;

  const actions = target.actions ?? [];
  const shown   = showAll ? actions : actions.slice(0, 5);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
      {/* Collapsed header — always visible */}
      <button className="w-full px-4 py-3 flex items-center gap-3" onClick={() => setOpen(!open)}>
        <Users size={14} className="text-brand-accent flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {cons && (
            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-lg border flex-shrink-0", cons.color, cons.bg, cons.border)}>
              {cons.he}
            </span>
          )}
          <span className="text-white text-sm font-bold">${target.targetMean?.toFixed(2)}</span>
          <span className="text-gray-500 text-[11px]">
            ({target.numberOfAnalysts} {isRTL ? "אנליסטים" : "analysts"})
          </span>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3" dir={isRTL ? "rtl" : "ltr"}>

          {/* Big consensus + target */}
          <div className="flex items-stretch gap-3">
            {cons && (
              <div className={clsx("flex-1 rounded-xl p-3 border text-center", cons.bg, cons.border)}>
                <p className="text-gray-500 text-[10px] mb-1">{isRTL ? "קונצנזוס אנליסטים" : "Analyst Consensus"}</p>
                <p className={clsx("text-base font-bold", cons.color)}>{cons.he}</p>
                <p className="text-gray-500 text-[10px] mt-1">{target.numberOfAnalysts} {isRTL ? "אנליסטים" : "analysts"}</p>
              </div>
            )}
            <div className="flex-1 rounded-xl p-3 bg-white/5 border border-white/8 text-center">
              <p className="text-gray-500 text-[10px] mb-1">{isRTL ? "יעד מחיר ממוצע" : "Price Target"}</p>
              <p className="text-white text-base font-bold">${target.targetMean?.toFixed(0)}</p>
              <p className="text-gray-500 text-[10px] mt-1">${target.targetLow?.toFixed(0)} – ${target.targetHigh?.toFixed(0)}</p>
            </div>
          </div>

          {/* Bullish / Neutral / Bearish summary bar */}
          {b && (
            <div>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-2">
                <div className="bg-brand-green rounded-s-full transition-all" style={{ width: `${bullPct}%` }} />
                <div className="bg-brand-yellow transition-all" style={{ width: `${holdPct}%` }} />
                <div className="bg-brand-red rounded-e-full transition-all" style={{ width: `${bearPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-brand-green font-bold">▲ {isRTL ? "שורי" : "Bullish"} {bullPct}%</span>
                <span className="text-brand-yellow">{isRTL ? "נייטרל" : "Neutral"} {holdPct}%</span>
                <span className="text-brand-red font-bold">{isRTL ? "דובי" : "Bearish"} {bearPct}% ▼</span>
              </div>

              {/* Detailed bars */}
              <div className="mt-3 space-y-1.5">
                {([
                  { label: "קנייה חזקה", val: b.strongBuy,  color: "#22c55e" },
                  { label: "קנייה",       val: b.buy,        color: "#86efac" },
                  { label: "החזק",        val: b.hold,       color: "#f59e0b" },
                  { label: "מכירה",       val: b.sell,       color: "#f87171" },
                  { label: "מכירה חזקה",  val: b.strongSell, color: "#ef4444" },
                ] as const).map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-20 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(val / total) * 100}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[10px] font-bold w-4 text-end flex-shrink-0" style={{ color }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend over quarters */}
          {target.trend?.length > 1 && (
            <div>
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-2">
                {isRTL ? "מגמת אנליסטים לפי רבעון" : "Analyst Trend by Quarter"}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {target.trend.map(t => {
                  const tot = t.strongBuy + t.buy + t.hold + t.sell + t.strongSell || 1;
                  const bull = Math.round(((t.strongBuy + t.buy) / tot) * 100);
                  return (
                    <div key={t.period} className="bg-white/5 rounded-xl p-2.5 text-center">
                      <p className="text-gray-500 text-[9px] mb-1">{t.period === "0m" ? (isRTL ? "עכשיו" : "Now") : t.period}</p>
                      <p className={clsx("text-sm font-bold", bull > 60 ? "text-brand-green" : bull > 40 ? "text-brand-yellow" : "text-brand-red")}>
                        {bull}%
                      </p>
                      <p className="text-gray-600 text-[9px]">{isRTL ? "שורי" : "Bullish"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Firm-level actions */}
          {actions.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-2">
                {isRTL ? "פעולות אחרונות — בתי השקעות" : "Recent Analyst Actions"}
              </p>
              <div className="space-y-0">
                {shown.map((a, i) => {
                  const act = actionInfo(a.action);
                  const ActIcon = act.Icon;
                  return (
                    <div key={i} className={clsx("flex items-center gap-3 py-2.5", i < shown.length - 1 && "border-b border-white/5")}>
                      <div className={clsx("w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0",
                        act.color === "text-brand-green" ? "bg-brand-green/10"
                        : act.color === "text-brand-red" ? "bg-brand-red/10"
                        : "bg-brand-accent/10")}>
                        <ActIcon size={13} className={act.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{a.firm}</p>
                        <p className="text-gray-500 text-[10px]">
                          {a.fromGrade ? `${gradeToHe(a.fromGrade)} ← ` : ""}
                          <span className={clsx("font-semibold", gradeColor(a.toGrade))}>{gradeToHe(a.toGrade)}</span>
                        </p>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <p className={clsx("text-xs font-bold", act.color)}>{act.label}</p>
                        <p className="text-gray-600 text-[10px]">{a.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {actions.length > 5 && (
                <button onClick={() => setShowAll(!showAll)}
                  className="mt-2 text-brand-accent text-xs flex items-center gap-1">
                  {showAll
                    ? <><ChevronUp size={11} />{isRTL ? "פחות" : "Show less"}</>
                    : <><ChevronDown size={11} />{isRTL ? `עוד ${actions.length - 5} פירמות` : `+${actions.length - 5} more`}</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TvChart({ symbol, timeframe, lang }: { symbol: string; timeframe: Timeframe; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}_${timeframe.label}`;

  useEffect(() => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";

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
        toolbar_bg: "#131722",
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        withdateranges: true,
        save_image: false,
        container_id: id,
        studies: timeframe.label === "1D" || timeframe.label === "5D"
          ? ["Volume@tv-basicstudies", "RSI@tv-basicstudies"]
          : ["Volume@tv-basicstudies", "MASimple@tv-basicstudies"],
        disabled_features: [
          "header_symbol_search",
          "header_compare",
          "go_to_date",
        ],
        enabled_features: [
          "use_localstorage_for_settings",
          "side_toolbar_in_fullscreen_mode",
        ],
      });
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [symbol, timeframe.label, lang, id]);

  return (
    <div ref={ref} className="w-full rounded-2xl overflow-hidden border border-brand-border">
      <div id={id} className="w-full" style={{ height: "calc(100dvh - 310px)", minHeight: 360 }} />
    </div>
  );
}

export default function ChartsTab() {
  const { lang, isRTL, portfolio, watchlist } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [open, setOpen]         = useState(false);
  const [target, setTarget]     = useState<PriceTarget | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[2]);
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
    setSelected(sym); setSearch(sym); setOpen(false); setResults([]); setTarget(null);
    fetch(`/api/price-target?symbol=${sym}`)
      .then(r => r.json()).then(d => { if (d.targetMean) setTarget(d); }).catch(() => {});
  }

  const allSymbols = [...new Set([...portfolio.map(p => p.symbol), ...watchlist])];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="flex flex-col gap-2 -mx-4 px-4">
      {/* Compact top bar: search + symbol pills on same row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-xl px-3 py-2">
            <Search size={13} className="text-gray-500 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
              placeholder={isRTL ? "חפש מניה..." : "Search symbol..."}
              value={search}
              onChange={e => handleInput(e.target.value)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {search && <button onClick={() => { setSearch(""); setResults([]); setOpen(false); setSelected(null); }}><X size={12} className="text-gray-500" /></button>}
          </div>
          {open && (
            <div className="absolute top-full start-0 end-0 z-20 mt-1 bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
              {results.map(r => (
                <button key={r.symbol} onMouseDown={() => select(r.symbol)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-start">
                  <span className="text-white font-bold text-sm w-14 flex-shrink-0">{r.symbol}</span>
                  <span className="text-gray-400 text-xs truncate">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Symbol pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {allSymbols.map(sym => (
          <button key={sym} onClick={() => select(sym)}
            className={clsx("flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
              selected === sym
                ? "bg-brand-accent border-brand-accent text-white"
                : "bg-white/5 border-white/8 text-gray-400 hover:text-white")}>
            {sym}
          </button>
        ))}
      </div>

      {selected ? (
        <>
          {/* Timeframe pills */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {TIMEFRAMES.map(tf => (
              <button key={tf.label} onClick={() => setTimeframe(tf)}
                className={clsx("flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all",
                  timeframe.label === tf.label
                    ? "bg-brand-accent border-brand-accent text-white"
                    : "bg-white/5 border-white/8 text-gray-400 hover:text-white")}>
                {isRTL ? tf.labelHe : tf.label}
              </button>
            ))}
          </div>

          {/* Chart — full height */}
          <TvChart key={`${selected}-${timeframe.label}`} symbol={selected} timeframe={timeframe} lang={lang} />

          {/* Analyst panel below */}
          {target && <AnalystPanel target={target} isRTL={isRTL} />}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <TrendingUp size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">
            {isRTL ? "בחר מניה לצפייה בגרף" : "Select a stock to view chart"}
          </p>
          <p className="text-gray-600 text-xs mb-5">
            {isRTL ? "לחץ על מניה מהרשימה למעלה, או חפש כל סימול" : "Tap from the list above, or search any symbol"}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            {["AAPL", "NVDA", "TSLA", "META", "MSFT", "AMZN"].map(sym => (
              <button key={sym} onClick={() => select(sym)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/8 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                {sym}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock comparison tool */}
      <StockCompare />
    </div>
  );
}
