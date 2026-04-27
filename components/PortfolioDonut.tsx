"use client";
import { useApp, PortfolioItem } from "@/lib/context";
import { useState } from "react";

type Quote = { symbol: string; price: number; changePercent: number };

const COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#e879f9", "#14b8a6",
];

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

type Props = {
  quotes: Record<string, Quote>;
  forex: number;
};

export default function PortfolioDonut({ quotes, forex }: Props) {
  const { portfolio, isRTL } = useApp();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  function effectivePrice(item: PortfolioItem): number {
    if (item.manualPrice && item.manualPrice > 0) return item.manualPrice;
    return quotes[item.symbol]?.price ?? 0;
  }

  const items = portfolio.map((item, i) => {
    const price = effectivePrice(item);
    const val = price * item.shares;
    const valUSD = item.currency === "ILS" ? val / forex : val;
    return { symbol: item.symbol, value: valUSD, color: COLORS[i % COLORS.length] };
  }).filter(i => i.value > 0);

  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0 || items.length === 0) return null;

  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerR = 78;
  const innerR = 52;
  const gap = 0.025;

  let cursor = 0;
  const slices = items.map((item) => {
    const angle = (item.value / total) * (2 * Math.PI);
    const start = cursor + gap / 2;
    const end = cursor + angle - gap / 2;
    cursor += angle;
    return { ...item, start, end, angle, pct: (item.value / total) * 100 };
  });

  const active = activeIdx !== null ? slices[activeIdx] : null;

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4">
      <p className="text-gray-400 text-xs font-medium mb-3">
        {isRTL ? "הקצאת תיק" : "Portfolio Allocation"}
      </p>
      <div className="flex items-center gap-4">
        {/* SVG donut */}
        <div className="relative flex-shrink-0">
          <svg width={SIZE} height={SIZE}>
            {slices.map((slice, i) => {
              const isActive = activeIdx === i;
              const r = isActive ? outerR + 5 : outerR;
              return (
                <path
                  key={slice.symbol}
                  d={arcPath(cx, cy, r, slice.start, slice.end)}
                  fill={slice.color}
                  opacity={activeIdx === null || isActive ? 1 : 0.4}
                  style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  onTouchStart={() => setActiveIdx(i)}
                  onTouchEnd={() => setActiveIdx(null)}
                />
              );
            })}
            {/* Inner hole */}
            <circle cx={cx} cy={cy} r={innerR} fill="#0f1320" />
            {/* Center label */}
            {active ? (
              <>
                <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{active.symbol}</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fill={active.color} fontSize="12" fontWeight="bold">{active.pct.toFixed(1)}%</text>
                <text x={cx} y={cy + 22} textAnchor="middle" fill="#9ca3af" fontSize="9">${active.value.toFixed(0)}</text>
              </>
            ) : (
              <>
                <text x={cx} y={cy - 4} textAnchor="middle" fill="#9ca3af" fontSize="9">{isRTL ? "סה״כ" : "Total"}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">${total.toFixed(0)}</text>
              </>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {slices.map((slice, i) => (
            <div key={slice.symbol}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-white text-xs font-bold flex-shrink-0 w-12 truncate">{slice.symbol}</span>
              <span className="text-gray-400 text-xs ms-auto">{slice.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
