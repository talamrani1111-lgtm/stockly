"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { BarChart3, RefreshCw } from "lucide-react";
import clsx from "clsx";

type Sector = { symbol: string; name: string; nameEn: string; changePercent: number };

export default function SectorPerformance() {
  const { lang, isRTL } = useApp();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/sectors")
      .then(r => r.json())
      .then(setSectors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-brand-accent" />
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            {lang === "he" ? "ביצועי סקטורים" : "Sector Performance"}
          </p>
        </div>
        <div className="space-y-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="shimmer h-8 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!sectors.length) return null;

  const max = Math.max(...sectors.map(s => Math.abs(s.changePercent)), 1);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-brand-accent" />
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            {lang === "he" ? "ביצועי סקטורים" : "Sector Performance"}
          </p>
        </div>
        <button onClick={load} className="text-gray-600 hover:text-gray-400 transition-colors p-1">
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="space-y-1.5">
        {sectors.map(s => {
          const isUp = s.changePercent >= 0;
          const barW = Math.abs(s.changePercent) / max * 100;
          return (
            <div key={s.symbol} className="flex items-center gap-2">
              {/* Label */}
              <div className="w-24 flex-shrink-0">
                <p className="text-gray-300 text-[10px] font-medium truncate">
                  {lang === "he" ? s.name : s.nameEn}
                </p>
                <p className="text-gray-600 text-[9px]">{s.symbol}</p>
              </div>

              {/* Bar */}
              <div className="flex-1 flex items-center gap-1.5 h-5">
                <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={clsx("h-1.5 rounded-full transition-all duration-500",
                      isUp ? "bg-brand-green" : "bg-brand-red")}
                    style={{ width: `${barW}%` }}
                  />
                </div>
              </div>

              {/* Value */}
              <p className={clsx("text-xs font-bold w-14 text-end flex-shrink-0",
                isUp ? "text-brand-green" : "text-brand-red")}>
                {isUp ? "+" : ""}{s.changePercent.toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-gray-700 text-[9px] text-center mt-2">
        {lang === "he" ? "נתוני יום המסחר הנוכחי · ETFs" : "Today's trading · via Sector ETFs"}
      </p>
    </div>
  );
}
