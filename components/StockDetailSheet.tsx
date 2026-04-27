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
};

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
  const startY = useRef(0);

  useEffect(() => {
    fetch(`/api/stock-info?symbol=${symbol}`).then(r => r.json()).then(setInfo).catch(() => {});
    fetch(`/api/price-target?symbol=${symbol}`).then(r => r.json()).then(d => { if (d.targetMean) setTarget(d); }).catch(() => {});
  }, [symbol]);

  // swipe down to close
  function onTouchStart(e: React.TouchEvent) { startY.current = e.touches[0].clientY; }
  function onTouchEnd(e: React.TouchEvent) {
    if (e.changedTouches[0].clientY - startY.current > 80) onClose();
  }

  const up = (quote?.changePercent ?? 0) >= 0;
  const price = quote?.price ?? 0;

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
              <span className="text-white text-2xl font-bold">${fmt(price)}</span>
              <span className={clsx("flex items-center gap-0.5 text-sm font-semibold", up ? "text-brand-green" : "text-brand-red")}>
                {up ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {fmt(Math.abs(quote?.change ?? 0))} ({fmt(Math.abs(quote?.changePercent ?? 0))}%)
              </span>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-lg font-bold">${fmt(target.targetMean)}</p>
                  <p className="text-gray-500 text-xs">${fmt(target.targetLow)} – ${fmt(target.targetHigh)}</p>
                </div>
                {target.recommendation && REC_LABELS[target.recommendation] && (
                  <span className={clsx("text-sm font-bold px-3 py-1.5 rounded-xl bg-white/5",
                    REC_LABELS[target.recommendation].color)}>
                    {isRTL ? REC_LABELS[target.recommendation].he : REC_LABELS[target.recommendation].en}
                  </span>
                )}
              </div>
              {/* Upside bar */}
              {price > 0 && target.targetLow && target.targetHigh && (
                <div className="mt-3">
                  <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-brand-accent/40 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, ((price - target.targetLow) / (target.targetHigh - target.targetLow)) * 100))}%` }} />
                    <div className="absolute inset-y-0 w-0.5 bg-white rounded-full"
                      style={{ left: `${Math.min(99, Math.max(0, ((price - target.targetLow) / (target.targetHigh - target.targetLow)) * 100))}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600 text-[10px]">${fmt(target.targetLow, 0)}</span>
                    <span className={clsx("text-[10px] font-semibold", target.targetMean > price ? "text-brand-green" : "text-brand-red")}>
                      {target.targetMean > price ? "▲" : "▼"} {Math.abs(((target.targetMean - price) / price) * 100).toFixed(0)}% {isRTL ? "פוטנציאל" : "upside"}
                    </span>
                    <span className="text-gray-600 text-[10px]">${fmt(target.targetHigh, 0)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key stats */}
          {info && (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-medium mb-3">{isRTL ? "נתונים מרכזיים" : "Key Stats"}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: isRTL ? "שווי שוק" : "Market Cap", val: fmtBig(info.marketCap) },
                  { label: isRTL ? "P/E נוכחי" : "P/E (TTM)", val: fmt(info.peRatio, 1) },
                  { label: isRTL ? "P/E עתידי" : "Fwd P/E", val: fmt(info.forwardPE, 1) },
                  { label: "EPS", val: info.eps != null ? `$${fmt(info.eps)}` : "—" },
                  { label: "Beta", val: fmt(info.beta, 2) },
                  { label: isRTL ? "נפח ממוצע" : "Avg Volume", val: fmtVol(info.avgVolume) },
                  { label: isRTL ? "שיא 52 שבועות" : "52W High", val: info.fiftyTwoWeekHigh ? `$${fmt(info.fiftyTwoWeekHigh)}` : "—" },
                  { label: isRTL ? "שפל 52 שבועות" : "52W Low", val: info.fiftyTwoWeekLow ? `$${fmt(info.fiftyTwoWeekLow)}` : "—" },
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
                  <p className="text-gray-400 text-xs">{isRTL ? "עלות ממוצעת:" : "Avg cost:"} ${fmt(portfolioItem.avgPrice)}</p>
                </div>
                <div className="text-end">
                  <p className="text-white text-sm font-bold">
                    {portfolioItem.currency === "ILS" ? "₪" : "$"}
                    {(price * portfolioItem.shares).toLocaleString("en", { maximumFractionDigits: 0 })}
                  </p>
                  <p className={clsx("text-xs font-bold flex items-center gap-0.5 justify-end",
                    pnlAmt >= 0 ? "text-brand-green" : "text-brand-red")}>
                    {pnlAmt >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {pnlAmt >= 0 ? "+" : ""}${Math.abs(pnlAmt).toFixed(0)}
                    {" "}({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                  </p>
                </div>
              </div>
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
                    placeholder={`$${price > 0 ? fmt(price) : "0.00"}`}
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
        </div>
      </div>
    </div>
  );
}
