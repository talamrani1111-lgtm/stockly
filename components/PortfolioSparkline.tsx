"use client";
import { useEffect, useState } from "react";

type DataPoint = { ts: number; value: number };
const STORAGE_KEY = "portfolio_history";
const DAILY_KEY = "portfolio_daily";
const MAX_INTRADAY = 60;
const MAX_DAILY = 365;

export function savePortfolioValue(value: number) {
  if (value <= 0) return;
  try {
    // Intraday — update at most every 5 minutes
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr: DataPoint[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const last = arr[arr.length - 1];
    if (last && now - last.ts < 5 * 60 * 1000) {
      arr[arr.length - 1] = { ts: now, value };
    } else {
      arr.push({ ts: now, value });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-MAX_INTRADAY)));

    // Daily — save one snapshot per calendar day
    const dailyRaw = localStorage.getItem(DAILY_KEY);
    const daily: DataPoint[] = dailyRaw ? JSON.parse(dailyRaw) : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();
    const lastDaily = daily[daily.length - 1];
    if (lastDaily && lastDaily.ts === todayTs) {
      daily[daily.length - 1] = { ts: todayTs, value };
    } else {
      daily.push({ ts: todayTs, value });
    }
    localStorage.setItem(DAILY_KEY, JSON.stringify(daily.slice(-MAX_DAILY)));
  } catch {}
}

function buildPath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length < 2) return "";
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y} ${cx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

type Period = "1D" | "1W" | "1M" | "3M" | "1Y";

const PERIODS: Period[] = ["1D", "1W", "1M", "3M", "1Y"];

function periodLabel(p: Period, isHe: boolean): string {
  if (isHe) return { "1D": "יום", "1W": "שבוע", "1M": "חודש", "3M": "3 חודשים", "1Y": "שנה" }[p];
  return p;
}

function cutoffMs(period: Period): number {
  const now = Date.now();
  const day = 86400000;
  return { "1D": now - day, "1W": now - 7 * day, "1M": now - 30 * day, "3M": now - 90 * day, "1Y": now - 365 * day }[period];
}

export default function PortfolioSparkline({ currentValue, isHe = false }: { currentValue: number; isHe?: boolean }) {
  const [intraday, setIntraday] = useState<DataPoint[]>([]);
  const [daily, setDaily] = useState<DataPoint[]>([]);
  const [period, setPeriod] = useState<Period>("1D");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIntraday(JSON.parse(raw));
      const dailyRaw = localStorage.getItem(DAILY_KEY);
      if (dailyRaw) setDaily(JSON.parse(dailyRaw));
    } catch {}
  }, [currentValue]);

  const cutoff = cutoffMs(period);
  const source = period === "1D" ? intraday : daily;
  const points = source.filter(p => p.ts >= cutoff);

  if (points.length < 2) {
    if (period !== "1D") {
      return (
        <div className="mt-3">
          <div className="flex gap-1 mb-2">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${period === p ? "bg-brand-accent text-black font-bold" : "text-gray-500 bg-white/5"}`}>
                {periodLabel(p, isHe)}
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-[10px] text-center py-3">
            {isHe ? "אין מספיק נתונים לתקופה זו" : "Not enough data for this period"}
          </p>
        </div>
      );
    }
    return null;
  }

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 300;
  const H = 56;
  const PAD = 2;

  const coords = points.map((p, i) => ({
    x: PAD + (i / (points.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((p.value - min) / range) * (H - PAD * 2),
  }));

  const linePath = buildPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${H} L ${coords[0].x} ${H} Z`;

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const isUp = last >= first;
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;
  const strokeColor = isUp ? "#22c55e" : "#ef4444";
  const fillId = `psgr_${isUp ? "g" : "r"}`;

  return (
    <div className="mt-3">
      {/* Period selector */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${period === p ? "bg-brand-accent text-black font-bold" : "text-gray-500 bg-white/5 hover:text-gray-300"}`}>
              {periodLabel(p, isHe)}
            </button>
          ))}
        </div>
        <span className={`text-[10px] font-semibold ${isUp ? "text-brand-green" : "text-brand-red"}`}>
          {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 56 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3" fill={strokeColor} />
      </svg>
    </div>
  );
}
