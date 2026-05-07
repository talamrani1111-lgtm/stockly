"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { Calendar, TrendingUp } from "lucide-react";
import clsx from "clsx";

type EarningsData = {
  symbol: string;
  nextEarningsDate: number | null;
  epsEstimate: number | null;
  lastFiscalYearEps: number | null;
};

type Props = { symbols: string[] };

export default function EarningsCountdown({ symbols }: Props) {
  const { lang, isRTL } = useApp();
  const [data, setData] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbols.length) { setLoading(false); return; }
    fetch(`/api/earnings?symbols=${symbols.join(",")}`)
      .then(r => r.json())
      .then((d: EarningsData[]) => {
        const withDates = d.filter(e => e.nextEarningsDate != null);
        withDates.sort((a, b) => (a.nextEarningsDate ?? 0) - (b.nextEarningsDate ?? 0));
        setData(withDates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbols.join(",")]); // eslint-disable-line

  if (loading || !data.length) return null;

  function daysUntil(ts: number) {
    const diff = ts - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function urgencyColor(days: number) {
    if (days <= 7)  return "text-brand-red";
    if (days <= 21) return "text-brand-yellow";
    return "text-gray-400";
  }

  function urgencyBg(days: number) {
    if (days <= 7)  return "bg-brand-red/10 border-brand-red/20";
    if (days <= 21) return "bg-brand-yellow/10 border-brand-yellow/20";
    return "bg-white/3 border-white/8";
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
      day: "numeric", month: "short"
    });
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-brand-accent" />
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
          {lang === "he" ? "דוחות קרובים" : "Upcoming Earnings"}
        </p>
      </div>

      <div className="space-y-2">
        {data.map(item => {
          const days = daysUntil(item.nextEarningsDate!);
          const isPast = days < 0;
          if (isPast) return null;
          return (
            <div key={item.symbol}
              className={clsx("flex items-center justify-between rounded-xl border px-3 py-2.5", urgencyBg(days))}>
              <div className="flex items-center gap-3">
                <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  days <= 7 ? "bg-brand-red/20" : days <= 21 ? "bg-brand-yellow/20" : "bg-white/8")}>
                  <Calendar size={13} className={urgencyColor(days)} />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{item.symbol}</p>
                  <p className="text-gray-500 text-[10px]">{formatDate(item.nextEarningsDate!)}</p>
                </div>
              </div>

              <div className="text-end">
                <p className={clsx("text-sm font-bold", urgencyColor(days))}>
                  {days === 0
                    ? (lang === "he" ? "היום!" : "Today!")
                    : days === 1
                    ? (lang === "he" ? "מחר" : "Tomorrow")
                    : lang === "he" ? `${days} ימים` : `${days}d`}
                </p>
                {item.epsEstimate != null && (
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp size={9} className="text-gray-600" />
                    <p className="text-gray-500 text-[10px]">EPS {item.epsEstimate > 0 ? "+" : ""}{item.epsEstimate.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
