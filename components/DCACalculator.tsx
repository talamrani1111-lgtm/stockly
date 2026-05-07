"use client";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

type DataPoint = { date: string; invested: number; value: number };

const PRESETS = ["AAPL", "NVDA", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "VOO", "QQQ", "SPY"];
const PERIOD_OPTIONS = [
  { label: "6M", labelHe: "6 חודשים", months: 6 },
  { label: "1Y", labelHe: "שנה",      months: 12 },
  { label: "2Y", labelHe: "2 שנים",   months: 24 },
  { label: "3Y", labelHe: "3 שנים",   months: 36 },
  { label: "5Y", labelHe: "5 שנים",   months: 60 },
];

export default function DCACalculator() {
  const { lang, isRTL } = useApp();
  const [symbol, setSymbol] = useState("VOO");
  const [monthly, setMonthly] = useState("200");
  const [period, setPeriod] = useState(12);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataPoint[] | null>(null);
  const [error, setError] = useState(false);

  async function calculate() {
    if (!symbol || !monthly) return;
    setLoading(true); setError(false); setResult(null);

    // Map months to Yahoo Finance range
    const rangeMap: Record<number, string> = {
      6: "6mo", 12: "1y", 24: "2y", 36: "3y", 60: "5y"
    };
    const range = rangeMap[period] ?? "1y";

    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1mo&range=${range}`
      );
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const timestamps: number[] = result?.timestamp ?? [];
      const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];

      const monthlyAmt = parseFloat(monthly);
      let totalInvested = 0;
      let totalShares = 0;
      const points: DataPoint[] = [];

      timestamps.forEach((ts, i) => {
        const price = closes[i];
        if (!price || price <= 0) return;
        totalShares += monthlyAmt / price;
        totalInvested += monthlyAmt;
        points.push({
          date: new Date(ts * 1000).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { month: "short", year: "2-digit" }),
          invested: totalInvested,
          value: totalShares * price,
        });
      });

      setResult(points);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const last = result?.[result.length - 1];
  const gain = last ? last.value - last.invested : 0;
  const gainPct = last && last.invested > 0 ? (gain / last.invested) * 100 : 0;
  const isUp = gain >= 0;

  // Build mini chart path
  function buildPath(points: DataPoint[], w: number, h: number): { valueLine: string; investLine: string } {
    const vals = points.map(p => p.value);
    const minV = Math.min(...vals, ...points.map(p => p.invested));
    const maxV = Math.max(...vals, ...points.map(p => p.invested));
    const range = maxV - minV || 1;
    const toX = (i: number) => (i / (points.length - 1)) * w;
    const toY = (v: number) => h - ((v - minV) / range) * h * 0.85 - h * 0.05;
    const valueLine = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
    const investLine = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.invested).toFixed(1)}`).join(" ");
    return { valueLine, investLine };
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={14} className="text-brand-accent" />
        <p className="text-white text-sm font-semibold">
          {lang === "he" ? "מחשבון DCA" : "DCA Calculator"}
        </p>
        <span className="text-gray-600 text-[10px]">
          {lang === "he" ? "(השקעה חודשית קבועה)" : "(Dollar-Cost Averaging)"}
        </span>
      </div>

      {/* Symbol */}
      <div className="mb-3">
        <p className="text-gray-500 text-[10px] mb-1.5">{lang === "he" ? "מניה / ETF" : "Stock / ETF"}</p>
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white text-sm font-bold uppercase focus:outline-none focus:border-brand-accent/50 text-center"
          maxLength={6}
          placeholder="VOO"
        />
        <div className="flex gap-1.5 flex-wrap mt-2">
          {PRESETS.map(s => (
            <button key={s} onClick={() => setSymbol(s)}
              className={clsx("text-[10px] rounded-lg px-2 py-1 transition-colors",
                symbol === s
                  ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly amount */}
      <div className="mb-3">
        <p className="text-gray-500 text-[10px] mb-1.5">{lang === "he" ? "סכום חודשי ($)" : "Monthly Amount ($)"}</p>
        <div className="flex gap-2">
          {["100", "200", "500", "1000"].map(v => (
            <button key={v} onClick={() => setMonthly(v)}
              className={clsx("flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                monthly === v
                  ? "bg-brand-accent border-brand-accent text-white"
                  : "bg-brand-surface border-brand-border text-gray-400 hover:text-white")}>
              ${v}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={monthly}
          onChange={e => setMonthly(e.target.value)}
          className="w-full mt-2 bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-accent/50"
          placeholder={lang === "he" ? "סכום אחר..." : "Custom amount..."}
        />
      </div>

      {/* Period */}
      <div className="mb-4">
        <p className="text-gray-500 text-[10px] mb-1.5">{lang === "he" ? "תקופה" : "Period"}</p>
        <div className="flex gap-1.5">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.months} onClick={() => setPeriod(opt.months)}
              className={clsx("flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all",
                period === opt.months
                  ? "bg-brand-accent border-brand-accent text-white"
                  : "bg-brand-surface border-brand-border text-gray-400 hover:text-white")}>
              {lang === "he" ? opt.labelHe : opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calculate button */}
      <button onClick={calculate} disabled={loading}
        className="w-full bg-brand-accent text-black font-bold text-sm py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity mb-4 press-effect">
        {loading
          ? (lang === "he" ? "מחשב..." : "Calculating...")
          : (lang === "he" ? `חשב $${monthly}/חודש ב-${symbol}` : `Calculate $${monthly}/mo in ${symbol}`)}
      </button>

      {/* Results */}
      {result && last && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/4 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-[9px] mb-1">{lang === "he" ? "סה״כ הושקע" : "Total Invested"}</p>
              <p className="text-white text-sm font-bold">${last.invested.toLocaleString("en", { maximumFractionDigits: 0 })}</p>
            </div>
            <div className={clsx("rounded-xl p-3 text-center", isUp ? "bg-brand-green/10" : "bg-brand-red/10")}>
              <p className="text-gray-500 text-[9px] mb-1">{lang === "he" ? "שווי נוכחי" : "Current Value"}</p>
              <p className={clsx("text-sm font-bold", isUp ? "text-brand-green" : "text-brand-red")}>
                ${last.value.toLocaleString("en", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className={clsx("rounded-xl p-3 text-center", isUp ? "bg-brand-green/10" : "bg-brand-red/10")}>
              <p className="text-gray-500 text-[9px] mb-1">{lang === "he" ? "רווח / הפסד" : "Gain / Loss"}</p>
              <div className="flex items-center justify-center gap-0.5">
                {isUp ? <TrendingUp size={11} className="text-brand-green" /> : <TrendingDown size={11} className="text-brand-red" />}
                <p className={clsx("text-sm font-bold", isUp ? "text-brand-green" : "text-brand-red")}>
                  {isUp ? "+" : ""}{gainPct.toFixed(1)}%
                </p>
              </div>
              <p className={clsx("text-[10px] font-semibold", isUp ? "text-brand-green/70" : "text-brand-red/70")}>
                {isUp ? "+" : ""}${Math.abs(gain).toLocaleString("en", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Mini chart */}
          {result.length >= 3 && (() => {
            const paths = buildPath(result, 300, 60);
            return (
              <div className="rounded-xl bg-white/3 p-3 mb-3">
                <svg viewBox="0 0 300 60" className="w-full h-16">
                  {/* Invested line (dashed) */}
                  <path d={paths.investLine} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
                  {/* Value line */}
                  <path d={paths.valueLine} fill="none" stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between text-[9px] mt-1">
                  <span className="text-gray-600">{result[0].date}</span>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1 text-gray-500">
                      <span className="w-4 border-t border-dashed border-white/30" />
                      {lang === "he" ? "הושקע" : "Invested"}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: isUp ? "#22c55e" : "#ef4444" }}>
                      <span className="w-4 border-t-2" style={{ borderColor: isUp ? "#22c55e" : "#ef4444" }} />
                      {lang === "he" ? "שווי" : "Value"}
                    </span>
                  </div>
                  <span className="text-gray-600">{last.date}</span>
                </div>
              </div>
            );
          })()}

          <p className="text-gray-600 text-[9px] text-center">
            {lang === "he"
              ? `השקעה של $${monthly} לחודש ב-${symbol} במשך ${period >= 12 ? `${period/12} שנ${period/12 === 1 ? "ה" : "ים"}` : `${period} חודשים`}`
              : `$${monthly}/mo in ${symbol} over ${period >= 12 ? `${period/12}y` : `${period}mo`}`}
          </p>
        </div>
      )}

      {error && (
        <p className="text-brand-red text-sm text-center">
          {lang === "he" ? "לא נמצאו נתונים — בדוק את הסימול" : "No data found — check symbol"}
        </p>
      )}
    </div>
  );
}
