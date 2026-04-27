"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import clsx from "clsx";

type DataPoint = { ts: number; value: number };
type BenchmarkPoint = { ts: number; spy: number; qqq: number };

function normalize(points: DataPoint[]): DataPoint[] {
  if (!points.length) return [];
  const base = points[0].value;
  return points.map(p => ({ ts: p.ts, value: base > 0 ? ((p.value - base) / base) * 100 : 0 }));
}

function Sparkline({ points, color, width = 300, height = 120 }: {
  points: Array<{ x: number; y: number }>; color: string; width?: number; height?: number;
}) {
  if (points.length < 2) return null;
  function pathD() {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y} ${cx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }
  return <path d={pathD()} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />;
}

export default function MarketComparison() {
  const { portfolio, isRTL } = useApp();
  const [portfolioHistory, setPortfolioHistory] = useState<DataPoint[]>([]);
  const [spyHistory, setSpyHistory] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load portfolio history from localStorage
    try {
      const raw = localStorage.getItem("portfolio_history");
      if (raw) setPortfolioHistory(JSON.parse(raw));
    } catch {}

    // Fetch SPY historical data from Yahoo Finance for comparison
    fetch("/api/market-history?symbols=SPY,QQQ")
      .then(r => r.json())
      .then(d => { if (d.spy) setSpyHistory(d.spy); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [portfolio]);

  const portfolioNorm = normalize(portfolioHistory);
  const spyNorm = normalize(spyHistory);

  const allValues = [...portfolioNorm.map(p => p.value), ...spyNorm.map(p => p.value)];
  const minV = Math.min(...allValues, 0);
  const maxV = Math.max(...allValues, 0);
  const range = maxV - minV || 1;

  const W = 300; const H = 120; const PAD = 8;

  function toCoords(points: DataPoint[]): Array<{ x: number; y: number }> {
    if (!points.length) return [];
    const first = points[0].ts;
    const last = points[points.length - 1].ts;
    const timeRange = last - first || 1;
    return points.map(p => ({
      x: PAD + ((p.ts - first) / timeRange) * (W - PAD * 2),
      y: H - PAD - ((p.value - minV) / range) * (H - PAD * 2),
    }));
  }

  const portfolioCoords = toCoords(portfolioNorm);
  const spyCoords = toCoords(spyNorm);

  const portfolioChange = portfolioNorm.length > 1
    ? portfolioNorm[portfolioNorm.length - 1].value : null;
  const spyChange = spyNorm.length > 1
    ? spyNorm[spyNorm.length - 1].value : null;

  if (portfolioHistory.length < 3) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center py-10">
        <p className="text-gray-500 text-sm">
          {isRTL
            ? "נדרש לפחות 3 מדידות לגרף השוואה. הנתונים נאספים אוטומטית."
            : "Need at least 3 data points. Data is collected automatically."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
      <p className="text-gray-400 text-xs font-medium mb-3">
        {isRTL ? "תיק שלי vs שוק (SPY)" : "My Portfolio vs Market (SPY)"}
      </p>

      {/* Legend */}
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-brand-accent rounded" />
          <span className="text-gray-400 text-[10px]">{isRTL ? "התיק שלי" : "My Portfolio"}</span>
          {portfolioChange !== null && (
            <span className={clsx("text-[10px] font-bold", portfolioChange >= 0 ? "text-brand-green" : "text-brand-red")}>
              {portfolioChange >= 0 ? "+" : ""}{portfolioChange.toFixed(1)}%
            </span>
          )}
        </div>
        {spyHistory.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-gray-500 rounded" />
            <span className="text-gray-400 text-[10px]">SPY</span>
            {spyChange !== null && (
              <span className={clsx("text-[10px] font-bold", spyChange >= 0 ? "text-brand-green" : "text-brand-red")}>
                {spyChange >= 0 ? "+" : ""}{spyChange.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="shimmer w-full rounded-xl" style={{ height: 120 }} />
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
          {/* Zero line */}
          {minV < 0 && maxV > 0 && (
            <line
              x1={PAD} y1={H - PAD - ((0 - minV) / range) * (H - PAD * 2)}
              x2={W - PAD} y2={H - PAD - ((0 - minV) / range) * (H - PAD * 2)}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4"
            />
          )}
          <Sparkline points={spyCoords} color="#6b7280" />
          <Sparkline points={portfolioCoords} color="#3b82f6" />
          {portfolioCoords.length > 0 && (
            <circle
              cx={portfolioCoords[portfolioCoords.length - 1].x}
              cy={portfolioCoords[portfolioCoords.length - 1].y}
              r="3" fill="#3b82f6"
            />
          )}
        </svg>
      )}

      <p className="text-gray-600 text-[10px] mt-1">
        {isRTL ? "% שינוי מאז ההתחלה" : "% change since first data point"}
      </p>
    </div>
  );
}
