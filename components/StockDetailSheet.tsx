"use client";
import { useEffect, useRef, useState } from "react";
import { useApp, PortfolioItem } from "@/lib/context";
import { X, Target, Bell, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

type Props = {
  symbol: string;
  quote: { price: number; change: number; changePercent: number } | null;
  portfolioItem?: PortfolioItem;
  forex: number;
  onClose: () => void;
  onSetAlert: (symbol: string, price: number, direction: "above" | "below") => void;
};

type StockInfo = {
  shortName?: string;
  marketCap?: number;
  peRatio?: number;
  forwardPE?: number;
  eps?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
};

type PriceTarget = {
  targetMean?: number;
  targetHigh?: number;
  targetLow?: number;
  recommendation?: string;
  numberOfAnalysts?: number;
  breakdown?: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  actions?: { firm: string; toGrade: string; fromGrade: string; action: string; date: string }[];
};

const ACTION_MAP: Record<string, { label: string; labelHe: string; color: string }> = {
  up:   { label: "Upgraded",   labelHe: "שדרוג",     color: "text-brand-green"  },
  down: { label: "Downgraded", labelHe: "הורדה",     color: "text-brand-red"    },
  init: { label: "Initiated",  labelHe: "כיסוי חדש", color: "text-brand-accent" },
  main: { label: "Maintained", labelHe: "אישור",     color: "text-gray-400"     },
  reit: { label: "Reiterated", labelHe: "אישור",     color: "text-gray-400"     },
};
function gradeColor(grade: string): string {
  const g = (grade ?? "").toLowerCase();
  if (g.includes("buy") || g.includes("outperform") || g.includes("overweight")) return "text-brand-green";
  if (g.includes("sell") || g.includes("underperform") || g.includes("underweight")) return "text-brand-red";
  return "text-brand-yellow";
}

const TV_SYMBOLS: Record<string, string> = {
  VOO: "AMEX:VOO", QQQ: "NASDAQ:QQQ", SOFI: "NASDAQ:SOFI",
  "TA-125": "TVC:TA125", NVDA: "NASDAQ:NVDA", AAPL: "NASDAQ:AAPL",
  MSFT: "NASDAQ:MSFT", GOOGL: "NASDAQ:GOOGL", META: "NASDAQ:META",
  AMZN: "NASDAQ:AMZN", TSLA: "NASDAQ:TSLA", PLTR: "NASDAQ:PLTR",
  RKLB: "NASDAQ:RKLB", AMD: "NASDAQ:AMD", SPY: "AMEX:SPY",
};
function getTVSymbol(s: string) { return TV_SYMBOLS[s.toUpperCase()] ?? `NASDAQ:${s}`; }

declare global { interface Window { TradingView: { widget: new (c: object) => void } } }

const REC_LABELS: Record<string, { he: string; en: string; color: string }> = {
  strong_buy: { he: "קנייה חזקה", en: "Strong Buy", color: "text-brand-green" },
  buy:        { he: "קנייה",      en: "Buy",         color: "text-brand-green" },
  hold:       { he: "החזק",       en: "Hold",        color: "text-brand-yellow" },
  sell:       { he: "מכירה",      en: "Sell",        color: "text-brand-red" },
  strong_sell:{ he: "מכירה חזקה", en: "Strong Sell", color: "text-brand-red" },
};

function fmt(n: number | undefined | null, decimals = 2): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

function fmtBig(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtVol(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function TvChart({ symbol, lang }: { symbol: string; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `detail_tv_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !ref.current) return;
      new window.TradingView.widget({
        autosize: true, symbol: getTVSymbol(symbol),
        interval: "D", timezone: "Asia/Jerusalem",
        theme: "dark", style: "1",
        locale: lang === "he" ? "he_IL" : "en",
        toolbar_bg: "#0f1320", enable_publishing: false,
        allow_symbol_change: false, hide_side_toolbar: true,
        withdateranges: true, container_id: id,
        disabled_features: ["header_symbol_search", "header_settings", "header_compare"],
        enabled_features: ["use_localstorage_for_settings"],
      });
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [symbol, lang, id]);

  return (
    <div ref={ref} className="w-full" style={{ height: 280 }}>
      <div id={id} className="w-full h-full" />
    </div>
  );
}

export default function StockDetailSheet({ symbol, quote, portfolioItem, forex, onClose, onSetAlert }: Props) {
  const { lang, isRTL } = useApp();
  const [info, setInfo] = useState<StockInfo | null>(null);
  const [target, setTarget] = useState<PriceTarget | null>(null);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDir, setAlertDir] = useState<"above" | "below">("above");
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [stopLossPct, setStopLossPct] = useState("5");
  const [note, setNote] = useState("");
  const startY = useRef(0);

  useEffect(() => {
    fetch(`/api/stock-info?symbol=${symbol}`).then(r => r.json()).then(setInfo).catch(() => {});
    fetch(`/api/price-target?symbol=${symbol}`).then(r => r.json()).then(d => { if (d.targetMean) setTarget(d); }).catch(() => {});
    setNote(localStorage.getItem(`stock_note_${symbol}`) ?? "");
  }, [symbol]);

  function saveNote(val: string) {
    setNote(val);
    if (val.trim()) localStorage.setItem(`stock_note_${symbol}`, val);
    else localStorage.removeItem(`stock_note_${symbol}`);
  }

  // swipe down to close
  function onTouchStart(e: React.TouchEvent) { startY.current = e.touches[0].clientY; }
  function onTouchEnd(e: React.TouchEvent) {
    if (e.changedTouches[0].clientY - startY.current > 80) onClose();
  }

  const isManual = portfolioItem?.manualPrice != null && portfolioItem.manualPrice > 0;
  const price = portfolioItem?.manualPrice ?? quote?.price ?? 0;
  const up = isManual
    ? price >= (portfolioItem?.avgPrice ?? 0)
    : (quote?.changePercent ?? 0) >= 0;
  const currencySign = portfolioItem?.currency === "ILS" ? "₪" : "$";

  const pnlAmt = portfolioItem && price && portfolioItem.avgPrice
    ? (price - portfolioItem.avgPrice) * portfolioItem.shares : null;
  const pnlPct = portfolioItem && price && portfolioItem.avgPrice
    ? ((price - portfolioItem.avgPrice) / portfolioItem.avgPrice) * 100 : null;

  function saveAlert() {
    const p = parseFloat(alertPrice);
    if (!p) return;
    onSetAlert(symbol, p, alertDir);
    setAlertSaved(true);
    setTimeout(() => { setAlertSaved(false); setShowAlertForm(false); setAlertPrice(""); }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-brand-surface rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: "94vh" }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-xl">{symbol}</h2>
              {info?.shortName && (
                <span className="text-gray-500 text-xs truncate max-w-[160px]">{info.shortName}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white text-2xl font-bold">{currencySign}{fmt(price)}</span>
              {!isManual && (
                <span className={clsx("flex items-center gap-0.5 text-sm font-semibold", up ? "text-brand-green" : "text-brand-red")}>
                  {up ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {fmt(Math.abs(quote?.change ?? 0))} ({fmt(Math.abs(quote?.changePercent ?? 0))}%)
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 mt-1">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-4">
          {/* Chart */}
          <div className="rounded-2xl overflow-hidden border border-brand-border">
            <TvChart symbol={symbol} lang={lang} />
          </div>

          {/* Analyst target */}
          {target?.targetMean && (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={13} className="text-brand-accent" />
                <span className="text-gray-400 text-xs font-medium">
                  {isRTL ? "יעד אנליסטים" : "Analyst Price Target"}
                  {target.numberOfAnalysts ? ` · ${target.numberOfAnalysts} ${isRTL ? "אנליסטים" : "analysts"}` : ""}
                </span>
              </div>

              {/* Price + consensus */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white text-2xl font-bold">${fmt(target.targetMean)}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {isRTL ? "טווח:" : "Range:"} ${fmt(target.targetLow, 0)} – ${fmt(target.targetHigh, 0)}
                  </p>
                </div>
                {target.recommendation && REC_LABELS[target.recommendation] && (
                  <div className="text-end">
                    <span className={clsx("text-base font-bold", REC_LABELS[target.recommendation].color)}>
                      {isRTL ? REC_LABELS[target.recommendation].he : REC_LABELS[target.recommendation].en}
                    </span>
                    {price > 0 && target.targetMean && (
                      <p className={clsx("text-xs font-semibold mt-0.5", target.targetMean > price ? "text-brand-green" : "text-brand-red")}>
                        {target.targetMean > price ? "▲ +" : "▼ "}
                        {Math.abs(((target.targetMean - price) / price) * 100).toFixed(1)}% {isRTL ? "פוטנציאל" : "upside"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Range bar */}
              {price > 0 && target.targetLow && target.targetHigh && (
                <div className="mb-4">
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((price - target.targetLow) / (target.targetHigh - target.targetLow)) * 100))}%`,
                        background: "linear-gradient(90deg, #ef444440, #3b82f6)"
                      }} />
                    <div className="absolute inset-y-0 w-1 bg-white rounded-full -translate-x-0.5"
                      style={{ left: `${Math.min(99, Math.max(0, ((price - target.targetLow) / (target.targetHigh - target.targetLow)) * 100))}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600 text-[10px]">{isRTL ? "שפל" : "Low"} ${fmt(target.targetLow, 0)}</span>
                    <span className="text-gray-500 text-[10px]">{isRTL ? "מחיר נוכחי" : "Current"} ${fmt(price, 0)}</span>
                    <span className="text-gray-600 text-[10px]">{isRTL ? "שיא" : "High"} ${fmt(target.targetHigh, 0)}</span>
                  </div>
                </div>
              )}

              {/* Breakdown bars */}
              {target.breakdown && (() => {
                const b = target.breakdown!;
                const total = b.strongBuy + b.buy + b.hold + b.sell + b.strongSell || 1;
                const bars = [
                  { label: isRTL ? "קנייה חזקה" : "Strong Buy", val: b.strongBuy, color: "#22c55e" },
                  { label: isRTL ? "קנייה" : "Buy",              val: b.buy,       color: "#86efac" },
                  { label: isRTL ? "החזק" : "Hold",              val: b.hold,      color: "#f59e0b" },
                  { label: isRTL ? "מכירה" : "Sell",             val: b.sell,      color: "#f87171" },
                  { label: isRTL ? "מכירה חזקה" : "Strong Sell", val: b.strongSell,color: "#ef4444" },
                ];
                return (
                  <div>
                    <p className="text-gray-500 text-[10px] font-medium mb-2">
                      {isRTL ? "המלצות אנליסטים" : "Analyst Recommendations"}
                    </p>
                    <div className="space-y-1.5">
                      {bars.map(({ label, val, color }) => val > 0 && (
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
                    <p className="text-gray-600 text-[10px] mt-2">
                      {isRTL
                        ? `נתונים מ-${total} אנליסטים · מקור: Yahoo Finance`
                        : `Based on ${total} analysts · Source: Yahoo Finance`}
                    </p>
                  </div>
                );
              })()}

              {/* Firm-level analyst actions */}
              {target.actions && target.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-2">
                    {isRTL ? "פעולות אחרונות — פירמות" : "Recent Analyst Actions"}
                  </p>
                  <div className="space-y-1.5">
                    {target.actions.slice(0, 6).map((a, i) => {
                      const act = ACTION_MAP[a.action.toLowerCase()] ?? { label: a.action, labelHe: a.action, color: "text-gray-400" };
                      return (
                        <div key={i} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{a.firm}</p>
                            <p className="text-gray-600 text-[10px]">{a.date}</p>
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
                </div>
              )}
            </div>
          )}

          {/* Key stats */}
          {info && (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-medium mb-3">{isRTL ? "נתונים מרכזיים" : "Key Stats"}</p>

              {/* 52-week position bar */}
              {info.fiftyTwoWeekLow && info.fiftyTwoWeekHigh && price > 0 && (() => {
                const lo = info.fiftyTwoWeekLow!;
                const hi = info.fiftyTwoWeekHigh!;
                const pct = Math.min(100, Math.max(0, ((price - lo) / (hi - lo)) * 100));
                const barColor = pct > 75 ? "#22c55e" : pct > 40 ? "#f59e0b" : "#ef4444";
                return (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500 text-[10px]">{isRTL ? "שפל שנתי" : "52W Low"} ${fmt(lo, 0)}</span>
                      <span className="text-gray-400 text-[10px] font-semibold">{pct.toFixed(0)}%{isRTL ? " מהשפל" : " from low"}</span>
                      <span className="text-gray-500 text-[10px]">{isRTL ? "שיא שנתי" : "52W High"} ${fmt(hi, 0)}</span>
                    </div>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      <div className="absolute inset-y-0 w-1 bg-white rounded-full -translate-x-0.5"
                        style={{ left: `${Math.min(99, pct)}%` }} />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: isRTL ? "שווי שוק" : "Market Cap", val: fmtBig(info.marketCap) },
                  { label: isRTL ? "P/E נוכחי" : "P/E (TTM)", val: fmt(info.peRatio, 1) },
                  { label: isRTL ? "P/E עתידי" : "Fwd P/E", val: fmt(info.forwardPE, 1) },
                  { label: "EPS", val: info.eps != null ? `$${fmt(info.eps)}` : "—" },
                  { label: "Beta", val: fmt(info.beta, 2) },
                  { label: isRTL ? "נפח ממוצע" : "Avg Volume", val: fmtVol(info.avgVolume) },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-gray-500 text-[10px] mb-0.5">{label}</p>
                    <p className="text-white text-sm font-semibold">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your position */}
          {portfolioItem && pnlAmt !== null && pnlPct !== null && (
            <div className={clsx("border rounded-2xl p-4",
              pnlAmt >= 0 ? "bg-green-gradient border-brand-green/20" : "bg-red-gradient border-brand-red/20")}>
              <p className="text-gray-400 text-xs font-medium mb-2">{isRTL ? "הפוזיציה שלי" : "My Position"}</p>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white text-sm">{portfolioItem.shares} {isRTL ? "מניות" : "shares"}</p>
                  <p className="text-gray-400 text-xs">{isRTL ? "עלות ממוצעת:" : "Avg cost:"} {currencySign}{fmt(portfolioItem.avgPrice)}</p>
                </div>
                <div className="text-end">
                  <p className="text-white text-sm font-bold">
                    {currencySign}
                    {(price * portfolioItem.shares).toLocaleString("he", { maximumFractionDigits: 0 })}
                  </p>
                  <p className={clsx("text-xs font-bold flex items-center gap-0.5 justify-end",
                    pnlAmt >= 0 ? "text-brand-green" : "text-brand-red")}>
                    {pnlAmt >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {pnlAmt >= 0 ? "+" : ""}{currencySign}{Math.abs(pnlAmt).toFixed(0)}
                    {" "}({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stop Loss */}
          {portfolioItem && price > 0 && !isManual && (
            <div className="bg-brand-red/8 border border-brand-red/20 rounded-2xl p-4">
              <p className="text-white text-sm font-semibold mb-3">
                🛡 {isRTL ? "Stop Loss אוטומטי" : "Auto Stop Loss"}
              </p>
              <p className="text-gray-400 text-xs mb-3">
                {isRTL
                  ? "קבל התראה כשהמניה יורדת X% מתחת למחיר הקנייה שלך"
                  : "Get alerted when price drops X% below your buy price"}
              </p>
              <div className="flex gap-2">
                {["3", "5", "10", "15"].map(pct => (
                  <button key={pct} onClick={() => setStopLossPct(pct)}
                    className={clsx("flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                      stopLossPct === pct
                        ? "bg-brand-red/30 border-brand-red/50 text-brand-red"
                        : "bg-white/5 border-white/10 text-gray-400")}>
                    -{pct}%
                  </button>
                ))}
              </div>
              {portfolioItem.avgPrice > 0 && (
                <p className="text-gray-500 text-xs mt-2 mb-3">
                  {isRTL ? "יעד:" : "Target:"}{" "}
                  <span className="text-brand-red font-semibold">
                    {currencySign}{(portfolioItem.avgPrice * (1 - parseFloat(stopLossPct) / 100)).toFixed(2)}
                  </span>
                  {" "}({isRTL ? "עלות קנייה" : "buy price"} {currencySign}{portfolioItem.avgPrice.toFixed(2)})
                </p>
              )}
              <button onClick={() => {
                const stopPrice = portfolioItem.avgPrice * (1 - parseFloat(stopLossPct) / 100);
                onSetAlert(symbol, parseFloat(stopPrice.toFixed(2)), "below");
                navigator.vibrate?.([20, 10, 20]);
              }}
                className="w-full py-2.5 rounded-xl bg-brand-red/20 hover:bg-brand-red/30 text-brand-red text-sm font-semibold border border-brand-red/30 transition-all">
                {isRTL ? "הגדר Stop Loss" : "Set Stop Loss"}
              </button>
            </div>
          )}

          {/* Price alert */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
            <button onClick={() => setShowAlertForm(!showAlertForm)}
              className="flex items-center gap-2 w-full">
              <Bell size={14} className="text-brand-accent" />
              <span className="text-white text-sm font-medium flex-1 text-start">
                {isRTL ? "הגדר התראת מחיר" : "Set Price Alert"}
              </span>
              <span className="text-gray-500 text-xs">{showAlertForm ? "▲" : "▼"}</span>
            </button>

            {showAlertForm && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => setAlertDir("above")}
                    className={clsx("flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                      alertDir === "above"
                        ? "bg-brand-green/20 border-brand-green/40 text-brand-green"
                        : "bg-white/5 border-white/10 text-gray-400")}>
                    {isRTL ? "מעל ▲" : "Above ▲"}
                  </button>
                  <button onClick={() => setAlertDir("below")}
                    className={clsx("flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                      alertDir === "below"
                        ? "bg-brand-red/20 border-brand-red/40 text-brand-red"
                        : "bg-white/5 border-white/10 text-gray-400")}>
                    {isRTL ? "מתחת ▼" : "Below ▼"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
                    placeholder={`${currencySign}${price > 0 ? fmt(price) : "0.00"}`}
                    type="number" step="0.01"
                    value={alertPrice} onChange={e => setAlertPrice(e.target.value)}
                  />
                  <button onClick={saveAlert}
                    className={clsx("px-4 rounded-xl text-sm font-semibold transition-all",
                      alertSaved
                        ? "bg-brand-green text-white"
                        : "bg-brand-accent hover:bg-blue-500 text-white")}>
                    {alertSaved ? "✓" : (isRTL ? "שמור" : "Save")}
                  </button>
                </div>
                <p className="text-gray-600 text-[10px]">
                  {isRTL
                    ? "תקבל push notification כשהמחיר יגיע ליעד"
                    : "You'll get a push notification when the price hits the target"}
                </p>
              </div>
            )}
          </div>

          {/* Personal note */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
            <p className="text-gray-400 text-xs font-medium mb-2">
              ✏️ {isRTL ? "הערה אישית" : "My Note"}
            </p>
            <textarea
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 resize-none transition-colors"
              rows={3}
              placeholder={isRTL ? "למה קניתי? מה היעד שלי? תזכורות..." : "Why I bought this, target, reminders..."}
              value={note}
              onChange={e => saveNote(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
