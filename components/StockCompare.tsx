"use client";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { GitCompare, Building2, Users, TrendingUp, BarChart3, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import clsx from "clsx";

type StockData = {
  symbol: string;
  price: number;
  changePercent: number;
  marketCap?: number;
  pe?: number;
  forwardPE?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  eps?: number;
  dividendYield?: number;
  avgVolume?: number;
};

type StockProfile = {
  description?: string | null;
  sector?: string | null;
  industry?: string | null;
  employees?: number | null;
  country?: string | null;
  website?: string | null;
  recBuy?: number;
  recHold?: number;
  recSell?: number;
  epsNextQtr?: number | null;
  epsGrowthNextYear?: number | null;
  revenueGrowthNextYear?: number | null;
  targetPrice?: number | null;
  recommendationKey?: string | null;
  returnOnEquity?: number | null;
  revenueGrowth?: number | null;
  grossMargins?: number | null;
  debtToEquity?: number | null;
  forwardEps?: number | null;
  pegRatio?: number | null;
  shortFloat?: number | null;
  institutionalOwnership?: number | null;
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
      forwardPE: info.forwardPE,
      beta: info.beta,
      week52High: info.fiftyTwoWeekHigh,
      week52Low: info.fiftyTwoWeekLow,
      eps: info.eps,
      dividendYield: info.dividendYield,
      avgVolume: info.avgVolume,
    };
  } catch { return null; }
}

async function fetchProfile(symbol: string): Promise<StockProfile | null> {
  try {
    const res = await fetch(`/api/stock-profile?symbol=${symbol}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

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

function fmtNum(n?: number | null) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en");
}

function recLabel(key?: string | null, lang = "en") {
  if (!key) return "—";
  const map: Record<string, { he: string; en: string }> = {
    "strong_buy":  { he: "קנייה חזקה", en: "Strong Buy"  },
    "buy":         { he: "קנייה",      en: "Buy"         },
    "hold":        { he: "החזק",       en: "Hold"        },
    "sell":        { he: "מכירה",      en: "Sell"        },
    "strong_sell": { he: "מכירה חזקה",en: "Strong Sell" },
  };
  return map[key]?.[lang as "he" | "en"] ?? key;
}

function recColor(key?: string | null) {
  if (!key) return "text-gray-400";
  if (key.includes("strong_buy") || key === "buy") return "text-brand-green";
  if (key.includes("sell")) return "text-brand-red";
  return "text-brand-yellow";
}

const PRESETS = ["AAPL", "NVDA", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "AMD", "VOO", "QQQ"];

export default function StockCompare() {
  const { lang, isRTL } = useApp();
  const [sym1, setSym1] = useState("NVDA");
  const [sym2, setSym2] = useState("AMD");
  const [active, setActive] = useState<1 | 2>(1);
  const [data1, setData1] = useState<StockData | null>(null);
  const [data2, setData2] = useState<StockData | null>(null);
  const [prof1, setProf1] = useState<StockProfile | null>(null);
  const [prof2, setProf2] = useState<StockProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  const [expanded1, setExpanded1] = useState(false);
  const [expanded2, setExpanded2] = useState(false);

  async function compare() {
    if (!sym1.trim() || !sym2.trim()) return;
    setLoading(true); setDone(false); setErr(false);
    setExpanded1(false); setExpanded2(false);
    const [d1, d2, p1, p2] = await Promise.all([
      fetchStock(sym1.trim().toUpperCase()),
      fetchStock(sym2.trim().toUpperCase()),
      fetchProfile(sym1.trim().toUpperCase()),
      fetchProfile(sym2.trim().toUpperCase()),
    ]);
    setData1(d1); setData2(d2);
    setProf1(p1); setProf2(p2);
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
      { label: { he: "מחיר",           en: "Price"        }, v1: fmt(data1.price, "$"),               v2: fmt(data2.price, "$"),               winner: null },
      { label: { he: "שינוי היום",     en: "Today %"      }, v1: fmt(data1.changePercent,"","%",2),   v2: fmt(data2.changePercent,"","%",2),   winner: w(data1.changePercent, data2.changePercent) },
      { label: { he: "שיא 52 שבוע",   en: "52W High"     }, v1: fmt(data1.week52High, "$"),          v2: fmt(data2.week52High, "$"),          winner: null },
      { label: { he: "שפל 52 שבוע",   en: "52W Low"      }, v1: fmt(data1.week52Low, "$"),           v2: fmt(data2.week52Low, "$"),           winner: null },
      { label: { he: "שווי שוק",      en: "Mkt Cap"      }, v1: fmt(data1.marketCap, "$"),           v2: fmt(data2.marketCap, "$"),           winner: w(data1.marketCap, data2.marketCap) },
      { label: { he: "P/E נוכחי",     en: "P/E"          }, v1: fmt(data1.pe,"","",1),               v2: fmt(data2.pe,"","",1),               winner: w(data1.pe, data2.pe, false) },
      { label: { he: "P/E עתידי",     en: "Fwd P/E"      }, v1: fmt(data1.forwardPE,"","",1),        v2: fmt(data2.forwardPE,"","",1),        winner: w(data1.forwardPE, data2.forwardPE, false) },
      { label: { he: "Beta",           en: "Beta"         }, v1: fmt(data1.beta,"","",2),             v2: fmt(data2.beta,"","",2),             winner: w(data1.beta, data2.beta, false) },
      { label: { he: "דיבידנד",       en: "Dividend"     }, v1: data1.dividendYield ? `${(data1.dividendYield*100).toFixed(2)}%` : "—", v2: data2.dividendYield ? `${(data2.dividendYield*100).toFixed(2)}%` : "—", winner: w(data1.dividendYield, data2.dividendYield) },
    ];
  }

  // --- Profile card for one stock ---
  function ProfileCard({ sym, data, prof, expanded, onToggle }: {
    sym: string; data: StockData | null; prof: StockProfile | null;
    expanded: boolean; onToggle: () => void;
  }) {
    const isLeft = sym === data1?.symbol;
    if (!data || !prof) return null;

    const totalRec = (prof.recBuy ?? 0) + (prof.recHold ?? 0) + (prof.recSell ?? 0);
    const buyPct  = totalRec > 0 ? Math.round((prof.recBuy  ?? 0) / totalRec * 100) : 0;
    const holdPct = totalRec > 0 ? Math.round((prof.recHold ?? 0) / totalRec * 100) : 0;
    const sellPct = totalRec > 0 ? Math.round((prof.recSell ?? 0) / totalRec * 100) : 0;

    return (
      <div className={clsx("rounded-2xl border p-4 mb-3",
        isLeft ? "border-brand-accent/25 bg-brand-accent/5" : "border-white/10 bg-white/3")}>

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={clsx("font-bold text-base", isLeft ? "text-brand-accent" : "text-white")}>{sym}</p>
            {prof.sector && <p className="text-gray-500 text-[10px] mt-0.5">{prof.sector} · {prof.industry}</p>}
            {prof.country && <p className="text-gray-600 text-[10px]">{prof.country}</p>}
          </div>
          <div className="text-end">
            <p className={clsx("text-xs font-bold", recColor(prof.recommendationKey))}>
              {recLabel(prof.recommendationKey, lang)}
            </p>
            {prof.targetPrice && (
              <p className="text-gray-500 text-[10px] mt-0.5">
                {lang === "he" ? "יעד:" : "Target:"} ${prof.targetPrice.toFixed(0)}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {prof.description && (
          <div className="mb-3">
            <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-3">
              {prof.description}
            </p>
          </div>
        )}

        {/* Analyst bar */}
        {totalRec > 0 && (
          <div className="mb-3">
            <p className="text-gray-500 text-[10px] mb-1.5">
              {lang === "he" ? `אנליסטים (${totalRec})` : `Analysts (${totalRec})`}
            </p>
            <div className="flex rounded-lg overflow-hidden h-2 gap-px">
              {buyPct > 0  && <div style={{ width: `${buyPct}%`  }} className="bg-brand-green" />}
              {holdPct > 0 && <div style={{ width: `${holdPct}%` }} className="bg-brand-yellow" />}
              {sellPct > 0 && <div style={{ width: `${sellPct}%` }} className="bg-brand-red" />}
            </div>
            <div className="flex gap-3 mt-1">
              <span className="text-brand-green  text-[9px]">▲ {buyPct}%</span>
              <span className="text-brand-yellow text-[9px]">= {holdPct}%</span>
              <span className="text-brand-red    text-[9px]">▼ {sellPct}%</span>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button onClick={onToggle}
          className="w-full flex items-center justify-center gap-1 text-gray-500 hover:text-gray-300 text-[10px] py-1.5 transition-colors">
          {expanded
            ? <><ChevronUp size={12} />{lang === "he" ? "פחות" : "Less"}</>
            : <><ChevronDown size={12} />{lang === "he" ? "עוד פרטים" : "More details"}</>}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-white/8 pt-3 mt-1 space-y-2">

            {/* Growth */}
            {(prof.epsGrowthNextYear != null || prof.revenueGrowthNextYear != null) && (
              <div>
                <p className="text-gray-500 text-[10px] font-semibold uppercase mb-1.5 flex items-center gap-1">
                  <TrendingUp size={10} />{lang === "he" ? "תחזיות צמיחה" : "Growth Estimates"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {prof.epsGrowthNextYear != null && (
                    <div className="bg-white/4 rounded-xl p-2.5">
                      <p className="text-gray-500 text-[9px]">{lang === "he" ? "צמיחת רווח (שנה)" : "EPS Growth (yr)"}</p>
                      <p className={clsx("text-sm font-bold mt-0.5", (prof.epsGrowthNextYear ?? 0) >= 0 ? "text-brand-green" : "text-brand-red")}>
                        {fmtPct(prof.epsGrowthNextYear)}
                      </p>
                    </div>
                  )}
                  {prof.revenueGrowthNextYear != null && (
                    <div className="bg-white/4 rounded-xl p-2.5">
                      <p className="text-gray-500 text-[9px]">{lang === "he" ? "צמיחת הכנסות (שנה)" : "Rev Growth (yr)"}</p>
                      <p className={clsx("text-sm font-bold mt-0.5", (prof.revenueGrowthNextYear ?? 0) >= 0 ? "text-brand-green" : "text-brand-red")}>
                        {fmtPct(prof.revenueGrowthNextYear)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financials */}
            <div>
              <p className="text-gray-500 text-[10px] font-semibold uppercase mb-1.5 flex items-center gap-1">
                <BarChart3 size={10} />{lang === "he" ? "נתונים פיננסיים" : "Financials"}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { l: { he: "מרווח גולמי", en: "Gross Margin"   }, v: prof.grossMargins   != null ? `${(prof.grossMargins*100).toFixed(1)}%`   : "—" },
                  { l: { he: "תשואת הון",   en: "ROE"            }, v: prof.returnOnEquity != null ? `${(prof.returnOnEquity*100).toFixed(1)}%` : "—" },
                  { l: { he: "חוב/הון",     en: "Debt/Equity"    }, v: prof.debtToEquity   != null ? prof.debtToEquity.toFixed(1)               : "—" },
                  { l: { he: "שורטים",      en: "Short Float"    }, v: prof.shortFloat      != null ? `${(prof.shortFloat*100).toFixed(1)}%`     : "—" },
                  { l: { he: "מוסדיים",     en: "Institutions"   }, v: prof.institutionalOwnership != null ? `${(prof.institutionalOwnership*100).toFixed(0)}%` : "—" },
                  { l: { he: "PEG",         en: "PEG Ratio"      }, v: prof.pegRatio        != null ? prof.pegRatio.toFixed(2)                   : "—" },
                ].map((row, i) => (
                  <div key={i} className="bg-white/4 rounded-lg px-2.5 py-2">
                    <p className="text-gray-600 text-[9px]">{row.l[lang as "he" | "en"]}</p>
                    <p className="text-white text-xs font-bold mt-0.5">{row.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Company info */}
            {(prof.employees || prof.website) && (
              <div>
                <p className="text-gray-500 text-[10px] font-semibold uppercase mb-1.5 flex items-center gap-1">
                  <Building2 size={10} />{lang === "he" ? "על החברה" : "About"}
                </p>
                <div className="space-y-1.5">
                  {prof.employees && (
                    <div className="flex items-center gap-2">
                      <Users size={10} className="text-gray-600 flex-shrink-0" />
                      <p className="text-gray-400 text-[10px]">
                        {lang === "he" ? "עובדים:" : "Employees:"} {fmtNum(prof.employees)}
                      </p>
                    </div>
                  )}
                  {prof.description && (
                    <p className="text-gray-400 text-[10px] leading-relaxed">
                      {prof.description.slice(0, 400)}{prof.description.length > 400 ? "..." : ""}
                    </p>
                  )}
                  {prof.website && (
                    <a href={prof.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-accent/70 text-[10px] hover:text-brand-accent transition-colors">
                      <ExternalLink size={9} />
                      {prof.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
        className="w-full bg-brand-accent text-black font-bold text-sm py-3 rounded-xl disabled:opacity-40 transition-opacity hover:opacity-90 mb-4 press-effect">
        {loading
          ? (lang === "he" ? "טוען..." : "Loading...")
          : (lang === "he" ? `השווה ${sym1} vs ${sym2}` : `Compare ${sym1} vs ${sym2}`)}
      </button>

      {/* Results */}
      {done && data1 && data2 && (
        <div>
          {/* Stats table */}
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-1 mb-3 pb-2 border-b border-brand-border">
              <div />
              <p className="text-center text-brand-accent font-bold text-sm">{data1.symbol}</p>
              <p className="text-center text-white font-bold text-sm">{data2.symbol}</p>
            </div>
            {rows().map((row, i) => (
              <div key={i} className={clsx("grid grid-cols-3 gap-1 py-2", i < rows().length - 1 && "border-b border-brand-border/40")}>
                <span className="text-gray-500 text-[10px] font-semibold self-center">{row.label[lang as "he" | "en"]}</span>
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

          {/* Profile cards */}
          <div className="border-t border-brand-border pt-4">
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-3">
              {lang === "he" ? "פרופיל חברות" : "Company Profiles"}
            </p>
            <ProfileCard sym={data1.symbol} data={data1} prof={prof1}
              expanded={expanded1} onToggle={() => setExpanded1(v => !v)} />
            <ProfileCard sym={data2.symbol} data={data2} prof={prof2}
              expanded={expanded2} onToggle={() => setExpanded2(v => !v)} />
          </div>
        </div>
      )}

      {err && (
        <p className="text-brand-red text-sm text-center">
          {lang === "he" ? "לא נמצאו נתונים — בדוק את הסימולים" : "No data found — check symbols"}
        </p>
      )}
    </div>
  );
}
