"use client";
import { useState } from "react";
import { useApp } from "@/lib/context";
import {
  GitCompare, Building2, Users, TrendingUp, TrendingDown,
  BarChart3, ChevronDown, ChevronUp, ExternalLink, Calendar,
  Shield, Target, Zap, DollarSign, Activity
} from "lucide-react";
import clsx from "clsx";

type Stock = {
  symbol: string;
  shortName?: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number | null;
  pe?: number | null;
  forwardPE?: number | null;
  beta?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
  dividendYield?: number | null;
  avgVolume?: number | null;
  eps?: number | null;
  priceToBook?: number | null;
  description?: string | null;
  sector?: string | null;
  industry?: string | null;
  employees?: number | null;
  country?: string | null;
  website?: string | null;
  grossMargins?: number | null;
  operatingMargins?: number | null;
  returnOnEquity?: number | null;
  debtToEquity?: number | null;
  revenueGrowth?: number | null;
  totalCash?: number | null;
  totalDebt?: number | null;
  freeCashFlow?: number | null;
  targetPrice?: number | null;
  recommendationKey?: string | null;
  pegRatio?: number | null;
  shortFloat?: number | null;
  institutionalPct?: number | null;
  insiderPct?: number | null;
  forwardEps?: number | null;
  recBuy?: number;
  recHold?: number;
  recSell?: number;
  epsGrowthNextYear?: number | null;
  revenueGrowthNextYear?: number | null;
  epsEstNextQtr?: number | null;
  nextEarningsDate?: number | null;
  epsEstimate?: number | null;
};

const PRESETS = ["AAPL", "NVDA", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "AMD", "VOO", "QQQ"];

function fmt(n?: number | null, prefix = "", suffix = "", dec = 2): string {
  if (n == null || isNaN(n)) return "—";
  if (prefix === "$" && n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (prefix === "$" && n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (prefix === "$" && n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `${prefix}${n.toFixed(dec)}${suffix}`;
}
function fmtPct(n?: number | null) {
  if (n == null || isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
}
function fmtBig(n?: number | null) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString("en")}`;
}
function fmtVol(n?: number | null) {
  if (n == null) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function recLabel(key?: string | null, lang = "en") {
  if (!key) return "—";
  const map: Record<string, { he: string; en: string }> = {
    strong_buy: { he: "קנייה חזקה", en: "Strong Buy" },
    buy:        { he: "קנייה",      en: "Buy"        },
    hold:       { he: "החזק",       en: "Hold"       },
    sell:       { he: "מכירה",      en: "Sell"       },
    strong_sell:{ he: "מכירה חזקה", en: "Strong Sell"},
  };
  return map[key]?.[lang as "he" | "en"] ?? key;
}
function recColor(key?: string | null) {
  if (!key) return "text-gray-400";
  if (key.includes("buy"))  return "text-brand-green";
  if (key.includes("sell")) return "text-brand-red";
  return "text-brand-yellow";
}

function daysUntil(ts: number) {
  return Math.ceil((ts - Date.now()) / 86400000);
}

// ── Section heading ──────────────────────────────────────────────
function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pt-4 border-t border-white/6">
      <span className="text-brand-accent">{icon}</span>
      <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{text}</p>
    </div>
  );
}

// ── Single metric mini-card ──────────────────────────────────────
function MetricCard({ label, v1, v2, win, isRTL }: {
  label: string; v1: string; v2: string; win: "left" | "right" | null; isRTL?: boolean;
}) {
  // In RTL the grid columns are visually reversed: col2=v2, col3=v1
  // So we swap display order but keep win logic based on data
  const col2 = isRTL ? v2 : v1;
  const col3 = isRTL ? v1 : v2;
  const col2Win = isRTL ? win === "right" : win === "left";
  const col3Win = isRTL ? win === "left"  : win === "right";
  return (
    <div className="grid grid-cols-3 gap-1 py-2 border-b border-brand-border/30 last:border-0">
      <span className="text-gray-600 text-[10px] font-semibold self-center">{label}</span>
      {([{val: col2, isWin: col2Win}, {val: col3, isWin: col3Win}]).map(({val, isWin}, i) => (
        <div key={i} className={clsx("text-center rounded-lg py-1", isWin && "bg-brand-green/15")}>
          <span className={clsx("text-xs font-bold", isWin ? "text-brand-green" : "text-gray-300")}>
            {isWin && "✓ "}{val}
          </span>
        </div>
      ))}
    </div>
  );
}

function w(a?: number | null, b?: number | null, hi = true): "left" | "right" | null {
  if (a == null || b == null || isNaN(a) || isNaN(b) || a === b) return null;
  return hi ? (a > b ? "left" : "right") : (a < b ? "left" : "right");
}

// ── Per-stock Profile column ──────────────────────────────────────
function ProfileCol({ s, accent, lang }: { s: Stock; accent: boolean; lang: string }) {
  const [showFull, setShowFull] = useState(false);
  const total = (s.recBuy ?? 0) + (s.recHold ?? 0) + (s.recSell ?? 0);
  const buyPct  = total > 0 ? Math.round((s.recBuy  ?? 0) / total * 100) : 0;
  const holdPct = total > 0 ? Math.round((s.recHold ?? 0) / total * 100) : 0;
  const sellPct = total > 0 ? Math.round((s.recSell ?? 0) / total * 100) : 0;
  const upside   = s.targetPrice && s.price ? ((s.targetPrice - s.price) / s.price * 100) : null;
  const earDays  = s.nextEarningsDate && s.nextEarningsDate > Date.now() ? daysUntil(s.nextEarningsDate) : null;
  const desc     = s.description ?? "";
  const shortDesc = desc.slice(0, 220) + (desc.length > 220 ? "..." : "");
  const lhe = lang === "he";

  return (
    <div className={clsx("flex-1 rounded-2xl border p-3",
      accent ? "border-brand-accent/30 bg-brand-accent/5" : "border-white/10 bg-white/3")}>

      {/* Name + rec */}
      <div className="mb-2">
        <p className={clsx("font-bold text-base", accent ? "text-brand-accent" : "text-white")}>{s.symbol}</p>
        {s.shortName && <p className="text-gray-500 text-[9px] mt-0.5 leading-tight">{s.shortName}</p>}
        {s.sector    && <p className="text-gray-600 text-[9px] truncate">{s.sector}</p>}
      </div>

      {/* Rec badge + target */}
      {s.recommendationKey && (
        <div className="mb-2">
          <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-lg",
            recColor(s.recommendationKey), "bg-white/8 border border-white/10")}>
            {recLabel(s.recommendationKey, lang)}
          </span>
          {s.targetPrice && (
            <p className="text-gray-500 text-[9px] mt-1">
              {lhe ? "יעד" : "Target"}: <span className="text-white font-bold">${s.targetPrice.toFixed(0)}</span>
              {upside != null && (
                <span className={clsx("ms-1", upside >= 0 ? "text-brand-green" : "text-brand-red")}>
                  ({upside >= 0 ? "+" : ""}{upside.toFixed(1)}%)
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Analyst bar */}
      {total > 0 && (
        <div className="mb-3">
          <div className="flex rounded-lg overflow-hidden h-1.5 gap-px mb-1">
            {buyPct  > 0 && <div style={{ width: `${buyPct}%`  }} className="bg-brand-green" />}
            {holdPct > 0 && <div style={{ width: `${holdPct}%` }} className="bg-brand-yellow" />}
            {sellPct > 0 && <div style={{ width: `${sellPct}%` }} className="bg-brand-red" />}
          </div>
          <div className="flex gap-2 text-[8px]">
            <span className="text-brand-green">▲{buyPct}%</span>
            <span className="text-brand-yellow">={holdPct}%</span>
            <span className="text-brand-red">▼{sellPct}%</span>
          </div>
        </div>
      )}

      {/* Description */}
      {desc && (
        <div className="mb-2">
          <p className="text-gray-400 text-[10px] leading-relaxed">
            {showFull ? desc : shortDesc}
          </p>
          {desc.length > 220 && (
            <button onClick={() => setShowFull(v => !v)}
              className="text-brand-accent/70 text-[9px] mt-1 flex items-center gap-0.5">
              {showFull
                ? <><ChevronUp size={9} />{lhe ? "פחות" : "Less"}</>
                : <><ChevronDown size={9} />{lhe ? "קרא עוד" : "Read more"}</>}
            </button>
          )}
        </div>
      )}

      {/* Next earnings */}
      {earDays != null && (
        <div className={clsx("rounded-lg px-2 py-1.5 mb-2",
          earDays <= 7 ? "bg-brand-red/10 border border-brand-red/20" : "bg-white/5 border border-white/8")}>
          <p className="text-gray-500 text-[9px]">{lhe ? "דוח הבא" : "Next earnings"}</p>
          <p className={clsx("text-xs font-bold", earDays <= 7 ? "text-brand-red" : "text-white")}>
            {earDays === 0 ? (lhe ? "היום!" : "Today!") : earDays === 1 ? (lhe ? "מחר" : "Tomorrow") : lhe ? `${earDays} ימים` : `${earDays}d`}
          </p>
          {s.epsEstimate != null && (
            <p className="text-gray-600 text-[9px]">EPS est. {s.epsEstimate > 0 ? "+" : ""}{s.epsEstimate.toFixed(2)}</p>
          )}
        </div>
      )}

      {/* Employees + website */}
      {s.employees && (
        <p className="text-gray-600 text-[9px] flex items-center gap-1 mb-1">
          <Users size={8} />{s.employees.toLocaleString("en")} {lhe ? "עובדים" : "employees"}
        </p>
      )}
      {s.website && (
        <a href={s.website} target="_blank" rel="noopener noreferrer"
          className="text-brand-accent/60 text-[9px] flex items-center gap-0.5 hover:text-brand-accent">
          <ExternalLink size={8} />{s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      )}
    </div>
  );
}

// ── Head-to-head verdict ─────────────────────────────────────────
function Verdict({ s1, s2, lang }: { s1: Stock; s2: Stock; lang: string }) {
  type Point = { key: string; label: string; labelHe: string; winner: string | null };
  const pts: Point[] = [
    { key: "growth",  label: "Growth",         labelHe: "צמיחה",         winner: w(s1.epsGrowthNextYear, s2.epsGrowthNextYear) === "left" ? s1.symbol : w(s1.epsGrowthNextYear, s2.epsGrowthNextYear) === "right" ? s2.symbol : null },
    { key: "value",   label: "Valuation",      labelHe: "תמחור",         winner: w(s1.pe, s2.pe, false) === "left" ? s1.symbol : w(s1.pe, s2.pe, false) === "right" ? s2.symbol : null },
    { key: "margin",  label: "Margins",        labelHe: "מרווחים",       winner: w(s1.grossMargins, s2.grossMargins) === "left" ? s1.symbol : w(s1.grossMargins, s2.grossMargins) === "right" ? s2.symbol : null },
    { key: "analyst", label: "Analyst Rating", labelHe: "אנליסטים",      winner: (() => { const buy1 = s1.recBuy ?? 0; const buy2 = s2.recBuy ?? 0; return buy1 > buy2 ? s1.symbol : buy2 > buy1 ? s2.symbol : null; })() },
    { key: "risk",    label: "Lower Risk",     labelHe: "סיכון נמוך",    winner: w(s1.beta, s2.beta, false) === "left" ? s1.symbol : w(s1.beta, s2.beta, false) === "right" ? s2.symbol : null },
    { key: "cash",    label: "Cash Position",  labelHe: "מזומן",         winner: w(s1.totalCash, s2.totalCash) === "left" ? s1.symbol : w(s1.totalCash, s2.totalCash) === "right" ? s2.symbol : null },
    { key: "upside",  label: "Analyst Upside", labelHe: "עלייה פוטנציאלית",winner: (() => {
        const u1 = s1.targetPrice && s1.price ? (s1.targetPrice - s1.price) / s1.price : null;
        const u2 = s2.targetPrice && s2.price ? (s2.targetPrice - s2.price) / s2.price : null;
        return w(u1, u2) === "left" ? s1.symbol : w(u1, u2) === "right" ? s2.symbol : null;
      })()},
  ].filter(p => p.winner !== null);

  const score1 = pts.filter(p => p.winner === s1.symbol).length;
  const score2 = pts.filter(p => p.winner === s2.symbol).length;
  const overall = score1 > score2 ? s1.symbol : score2 > score1 ? s2.symbol : null;
  const lhe = lang === "he";

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className="text-brand-yellow" />
        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
          {lhe ? "השוואת ראש בראש" : "Head-to-Head Verdict"}
        </p>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <p className="text-2xl font-black text-brand-accent">{score1}</p>
          <p className="text-[10px] text-gray-500">{s1.symbol}</p>
        </div>
        <div className="flex items-center justify-center">
          <p className="text-gray-600 text-sm font-bold">vs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">{score2}</p>
          <p className="text-[10px] text-gray-500">{s2.symbol}</p>
        </div>
      </div>

      {/* Category points */}
      <div className="space-y-1.5 mb-3">
        {pts.map(p => (
          <div key={p.key} className="flex items-center gap-2">
            <p className="text-gray-500 text-[10px] flex-1">{lhe ? p.labelHe : p.label}</p>
            <div className="flex gap-1">
              <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded",
                p.winner === s1.symbol ? "bg-brand-accent/20 text-brand-accent" : "text-gray-700")}>
                {s1.symbol}
              </span>
              <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded",
                p.winner === s2.symbol ? "bg-white/15 text-white" : "text-gray-700")}>
                {s2.symbol}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Overall winner */}
      {overall && (
        <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 text-center">
          <p className="text-brand-green text-sm font-bold">
            🏆 {overall} {lhe ? "מנצח על פי הנתונים" : "wins on the data"}
          </p>
          <p className="text-gray-500 text-[10px] mt-0.5">
            {lhe ? `${overall} זכה ב-${Math.max(score1, score2)} מתוך ${pts.length} קטגוריות` :
              `${overall} won ${Math.max(score1, score2)} of ${pts.length} categories`}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function StockCompare() {
  const { lang, isRTL } = useApp();
  const [sym1, setSym1] = useState("NVDA");
  const [sym2, setSym2] = useState("AMD");
  const [active, setActive] = useState<1 | 2>(1);
  const [s1, setS1] = useState<Stock | null>(null);
  const [s2, setS2] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  const lhe = lang === "he";

  async function compare() {
    if (!sym1.trim() || !sym2.trim()) return;
    setLoading(true); setDone(false); setErr(false);
    try {
      const res = await fetch(`/api/compare-data?symbols=${sym1.trim().toUpperCase()},${sym2.trim().toUpperCase()}`);
      const data: Stock[] = await res.json();
      if (data[0] && data[1]) { setS1(data[0]); setS2(data[1]); setDone(true); }
      else setErr(true);
    } catch { setErr(true); }
    finally { setLoading(false); }
  }

  function pickPreset(s: string) { active === 1 ? setSym1(s) : setSym2(s); }

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-4">
        <GitCompare size={15} className="text-brand-accent" />
        <p className="text-white text-sm font-semibold">
          {lhe ? "השוואת מניות" : "Stock Comparison"}
        </p>
      </div>

      {/* Symbol pickers */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {([1, 2] as const).map(n => {
          const sym = n === 1 ? sym1 : sym2;
          const set = n === 1 ? setSym1 : setSym2;
          return (
            <button key={n} onClick={() => setActive(n)}
              className={clsx("rounded-xl border px-3 py-2.5 transition-all",
                active === n ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-brand-border bg-brand-surface text-white")}>
              <input value={sym} onChange={e => set(e.target.value.toUpperCase())}
                onClick={e => { e.stopPropagation(); setActive(n); }}
                className="w-full bg-transparent text-center font-bold uppercase focus:outline-none text-sm"
                maxLength={6} />
            </button>
          );
        })}
      </div>

      {/* Presets */}
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
        className="w-full bg-brand-accent text-black font-bold text-sm py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity mb-4 press-effect">
        {loading
          ? (lhe ? "טוען..." : "Loading...")
          : (lhe ? `השווה ${sym1} vs ${sym2}` : `Compare ${sym1} vs ${sym2}`)}
      </button>

      {err && (
        <p className="text-brand-red text-sm text-center mb-2">
          {lhe ? "לא נמצאו נתונים — בדוק את הסימולים" : "No data found — check symbols"}
        </p>
      )}

      {done && s1 && s2 && (
        <div>
          {/* ── PRICE & MARKET ─────────────────── */}
          <SectionTitle icon={<Activity size={12} />} text={lhe ? "מחיר ושוק" : "Price & Market"} />
          <div className="grid grid-cols-3 gap-1 mb-2">
            <div />
            {isRTL ? (
              <>
                <p className="text-center text-white font-bold text-sm">{s2.symbol}</p>
                <p className="text-center text-brand-accent font-bold text-sm">{s1.symbol}</p>
              </>
            ) : (
              <>
                <p className="text-center text-brand-accent font-bold text-sm">{s1.symbol}</p>
                <p className="text-center text-white font-bold text-sm">{s2.symbol}</p>
              </>
            )}
          </div>
          {[
            { label: lhe ? "מחיר"         : "Price",       v1: fmt(s1.price,"$"),                     v2: fmt(s2.price,"$"),                     win: null },
            { label: lhe ? "שינוי היום"   : "Today",       v1: `${s1.changePercent>=0?"+":""}${s1.changePercent.toFixed(2)}%`, v2: `${s2.changePercent>=0?"+":""}${s2.changePercent.toFixed(2)}%`, win: w(s1.changePercent, s2.changePercent) },
            { label: lhe ? "שיא 52 שב׳"  : "52W High",    v1: fmt(s1.week52High,"$"),                v2: fmt(s2.week52High,"$"),                win: null },
            { label: lhe ? "שפל 52 שב׳"  : "52W Low",     v1: fmt(s1.week52Low,"$"),                 v2: fmt(s2.week52Low,"$"),                 win: null },
            { label: lhe ? "שווי שוק"    : "Mkt Cap",     v1: fmtBig(s1.marketCap),                  v2: fmtBig(s2.marketCap),                  win: w(s1.marketCap, s2.marketCap) },
            { label: lhe ? "מחזור יומי"  : "Avg Vol",     v1: fmtVol(s1.avgVolume),                  v2: fmtVol(s2.avgVolume),                  win: null },
          ].map((r, i) => <MetricCard key={i} label={r.label} v1={r.v1} v2={r.v2} win={r.win} isRTL={isRTL} />)}

          {/* ── VALUATION ───────────────────────── */}
          <SectionTitle icon={<DollarSign size={12} />} text={lhe ? "תמחור" : "Valuation"} />
          {[
            { label: "P/E",                  v1: fmt(s1.pe,"","",1),           v2: fmt(s2.pe,"","",1),           win: w(s1.pe, s2.pe, false) },
            { label: lhe?"P/E עתידי":"Fwd P/E",  v1: fmt(s1.forwardPE,"","",1),   v2: fmt(s2.forwardPE,"","",1),   win: w(s1.forwardPE, s2.forwardPE, false) },
            { label: "PEG",                  v1: fmt(s1.pegRatio,"","",2),     v2: fmt(s2.pegRatio,"","",2),     win: w(s1.pegRatio, s2.pegRatio, false) },
            { label: "P/B",                  v1: fmt(s1.priceToBook,"","",1),  v2: fmt(s2.priceToBook,"","",1),  win: w(s1.priceToBook, s2.priceToBook, false) },
            { label: "EPS",                  v1: fmt(s1.eps,"$"),              v2: fmt(s2.eps,"$"),              win: w(s1.eps, s2.eps) },
            { label: lhe?"EPS עתידי":"Fwd EPS",  v1: fmt(s1.forwardEps,"$"),      v2: fmt(s2.forwardEps,"$"),      win: w(s1.forwardEps, s2.forwardEps) },
            { label: lhe?"דיבידנד":"Dividend",   v1: s1.dividendYield ? `${(s1.dividendYield*100).toFixed(2)}%` : "—", v2: s2.dividendYield ? `${(s2.dividendYield*100).toFixed(2)}%` : "—", win: w(s1.dividendYield, s2.dividendYield) },
          ].map((r, i) => <MetricCard key={i} label={r.label} v1={r.v1} v2={r.v2} win={r.win} isRTL={isRTL} />)}

          {/* ── GROWTH ──────────────────────────── */}
          <SectionTitle icon={<TrendingUp size={12} />} text={lhe ? "צמיחה" : "Growth"} />
          {[
            { label: lhe?"צמיחת הכנסות":"Rev Growth",   v1: fmtPct(s1.revenueGrowth),              v2: fmtPct(s2.revenueGrowth),              win: w(s1.revenueGrowth, s2.revenueGrowth) },
            { label: lhe?"תחזית EPS שנה":"EPS Growth/yr", v1: fmtPct(s1.epsGrowthNextYear),         v2: fmtPct(s2.epsGrowthNextYear),         win: w(s1.epsGrowthNextYear, s2.epsGrowthNextYear) },
            { label: lhe?"תחזית הכנסות שנה":"Rev/yr est", v1: fmtPct(s1.revenueGrowthNextYear),     v2: fmtPct(s2.revenueGrowthNextYear),     win: w(s1.revenueGrowthNextYear, s2.revenueGrowthNextYear) },
          ].map((r, i) => <MetricCard key={i} label={r.label} v1={r.v1} v2={r.v2} win={r.win} isRTL={isRTL} />)}

          {/* ── FINANCIALS ──────────────────────── */}
          <SectionTitle icon={<BarChart3 size={12} />} text={lhe ? "פיננסים" : "Financials"} />
          {[
            { label: lhe?"מרווח גולמי":"Gross Margin",   v1: s1.grossMargins    ? `${(s1.grossMargins*100).toFixed(1)}%`    : "—", v2: s2.grossMargins    ? `${(s2.grossMargins*100).toFixed(1)}%`    : "—", win: w(s1.grossMargins, s2.grossMargins) },
            { label: lhe?"מרווח תפעולי":"Op Margin",     v1: s1.operatingMargins? `${(s1.operatingMargins*100).toFixed(1)}%`: "—", v2: s2.operatingMargins? `${(s2.operatingMargins*100).toFixed(1)}%`: "—", win: w(s1.operatingMargins, s2.operatingMargins) },
            { label: "ROE",                               v1: s1.returnOnEquity  ? `${(s1.returnOnEquity*100).toFixed(1)}%`  : "—", v2: s2.returnOnEquity  ? `${(s2.returnOnEquity*100).toFixed(1)}%`  : "—", win: w(s1.returnOnEquity, s2.returnOnEquity) },
            { label: lhe?"מזומן":"Cash",                 v1: fmtBig(s1.totalCash),  v2: fmtBig(s2.totalCash),  win: w(s1.totalCash, s2.totalCash) },
            { label: lhe?"חוב":"Total Debt",             v1: fmtBig(s1.totalDebt),  v2: fmtBig(s2.totalDebt),  win: w(s1.totalDebt, s2.totalDebt, false) },
            { label: "FCF",                              v1: fmtBig(s1.freeCashFlow),v2: fmtBig(s2.freeCashFlow),win: w(s1.freeCashFlow, s2.freeCashFlow) },
            { label: lhe?"חוב/הון":"D/E",                v1: fmt(s1.debtToEquity,"","",1), v2: fmt(s2.debtToEquity,"","",1), win: w(s1.debtToEquity, s2.debtToEquity, false) },
          ].map((r, i) => <MetricCard key={i} label={r.label} v1={r.v1} v2={r.v2} win={r.win} isRTL={isRTL} />)}

          {/* ── RISK ────────────────────────────── */}
          <SectionTitle icon={<Shield size={12} />} text={lhe ? "סיכון ובעלות" : "Risk & Ownership"} />
          {[
            { label: "Beta",                              v1: fmt(s1.beta,"","",2),  v2: fmt(s2.beta,"","",2),  win: w(s1.beta, s2.beta, false) },
            { label: lhe?"שורטים":"Short Float",          v1: s1.shortFloat ? `${(s1.shortFloat*100).toFixed(1)}%` : "—", v2: s2.shortFloat ? `${(s2.shortFloat*100).toFixed(1)}%` : "—", win: w(s1.shortFloat, s2.shortFloat, false) },
            { label: lhe?"מוסדיים":"Institutions",        v1: s1.institutionalPct ? `${(s1.institutionalPct*100).toFixed(0)}%` : "—", v2: s2.institutionalPct ? `${(s2.institutionalPct*100).toFixed(0)}%` : "—", win: w(s1.institutionalPct, s2.institutionalPct) },
            { label: lhe?"אינסיידרים":"Insiders",         v1: s1.insiderPct ? `${(s1.insiderPct*100).toFixed(1)}%` : "—", v2: s2.insiderPct ? `${(s2.insiderPct*100).toFixed(1)}%` : "—", win: null },
          ].map((r, i) => <MetricCard key={i} label={r.label} v1={r.v1} v2={r.v2} win={r.win} isRTL={isRTL} />)}

          {/* ── ANALYST TARGET ──────────────────── */}
          <SectionTitle icon={<Target size={12} />} text={lhe ? "יעד אנליסטים" : "Analyst Target"} />
          {[
            { label: lhe?"יעד מחיר":"Price Target",       v1: fmt(s1.targetPrice,"$",""  ,0), v2: fmt(s2.targetPrice,"$","",0), win: null },
            { label: lhe?"עלייה פוטנציאלית":"Upside",     v1: s1.targetPrice && s1.price ? `${(((s1.targetPrice-s1.price)/s1.price)*100).toFixed(1)}%` : "—", v2: s2.targetPrice && s2.price ? `${(((s2.targetPrice-s2.price)/s2.price)*100).toFixed(1)}%` : "—", win: (() => { const u1 = s1.targetPrice&&s1.price?(s1.targetPrice-s1.price)/s1.price:null; const u2 = s2.targetPrice&&s2.price?(s2.targetPrice-s2.price)/s2.price:null; return w(u1,u2); })() },
            { label: lhe?"המלצה":"Recommendation",        v1: recLabel(s1.recommendationKey, lang), v2: recLabel(s2.recommendationKey, lang), win: null },
          ].map((r, i) => <MetricCard key={i} label={r.label} v1={r.v1} v2={r.v2} win={r.win} isRTL={isRTL} />)}

          {/* ── VERDICT ─────────────────────────── */}
          <div className="mt-4">
            <Verdict s1={s1} s2={s2} lang={lang} />
          </div>

          {/* ── COMPANY PROFILES ────────────────── */}
          <SectionTitle icon={<Building2 size={12} />} text={lhe ? "פרופיל החברות" : "Company Profiles"} />
          <div className="flex gap-2">
            <ProfileCol s={s1} accent lang={lang} />
            <ProfileCol s={s2} accent={false} lang={lang} />
          </div>

          <p className="text-gray-700 text-[9px] text-center mt-3">
            {lhe ? "✓ = ערך עדיף לפי המדד · נתונים: Yahoo Finance" : "✓ = Better metric · Data: Yahoo Finance"}
          </p>
        </div>
      )}
    </div>
  );
}
