"use client";
import { useEffect, useState } from "react";

type DataPoint = { ts: number; value: number };
const STORAGE_KEY = "portfolio_history";
const MAX_POINTS = 60;

export function savePortfolioValue(value: number) {
  if (value <= 0) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr: DataPoint[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    // Only save if last save was more than 5 minutes ago
    const last = arr[arr.length - 1];
    if (last && now - last.ts < 5 * 60 * 1000) {
      arr[arr.length - 1] = { ts: now, value };
    } else {
      arr.push({ ts: now, value });
    }
    const trimmed = arr.slice(-MAX_POINTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export default function PortfolioSparkline({ currentValue }: { currentValue: number }) {
  const [points, setPoints] = useState<DataPoint[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPoints(JSON.parse(raw));
    } catch {}
  }, [currentValue]);

  if (points.length < 3) return null;

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 300;
  const H = 48;
  const PAD = 2;

  const coords = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
    return { x, y };
  });

  // Smooth path
  function pathD() {
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y} ${cx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }

  // Area path (filled under the line)
  function areaD() {
    return `${pathD()} L ${coords[coords.length - 1].x} ${H} L ${coords[0].x} ${H} Z`;
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const isUp = last >= first;
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;
  const strokeColor = isUp ? "#22c55e" : "#ef4444";
  const fillId = `grad_${isUp ? "g" : "r"}`;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-gray-500 text-[10px]">{points.length} {points.length === 1 ? "עדכון" : "עדכונים"}</span>
        <span className={`text-[10px] font-semibold ${isUp ? "text-brand-green" : "text-brand-red"}`}>
          {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 48 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD()} fill={`url(#${fillId})`} />
        <path d={pathD()} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Current value dot */}
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="3" fill={strokeColor}
        />
      </svg>
    </div>
  );
}
