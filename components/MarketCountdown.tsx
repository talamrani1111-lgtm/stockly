"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { Clock } from "lucide-react";

function getMarketState(): { status: "open" | "premarket" | "afterhours" | "closed"; nextEvent: string; msUntil: number } {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const s = et.getSeconds();
  const mins = h * 60 + m;

  const isWeekend = day === 0 || day === 6;

  function msTo(targetH: number, targetM: number, addDays = 0): number {
    const target = new Date(et);
    target.setHours(targetH, targetM, 0, 0);
    target.setDate(target.getDate() + addDays);
    return target.getTime() - et.getTime();
  }

  if (isWeekend) {
    const daysToMon = day === 6 ? 2 : 1;
    return { status: "closed", nextEvent: "open", msUntil: msTo(9, 30, daysToMon) };
  }

  if (mins >= 4 * 60 && mins < 9 * 60 + 30) {
    return { status: "premarket", nextEvent: "open", msUntil: msTo(9, 30) - s * 1000 };
  }
  if (mins >= 9 * 60 + 30 && mins < 16 * 60) {
    return { status: "open", nextEvent: "close", msUntil: msTo(16, 0) - s * 1000 };
  }
  if (mins >= 16 * 60 && mins < 20 * 60) {
    return { status: "afterhours", nextEvent: "close", msUntil: msTo(20, 0) - s * 1000 };
  }
  // Closed — next open is tomorrow (or Monday)
  const daysAhead = day === 5 ? 3 : 1;
  return { status: "closed", nextEvent: "open", msUntil: msTo(9, 30, daysAhead) };
}

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MarketCountdown() {
  const { lang } = useApp();
  const [state, setState] = useState(() => getMarketState());

  useEffect(() => {
    const id = setInterval(() => setState(getMarketState()), 1000);
    return () => clearInterval(id);
  }, []);

  const { status, nextEvent, msUntil } = state;

  const statusConfig = {
    open:       { dot: "bg-brand-green animate-pulse", label: { he: "שוק פתוח",   en: "Market Open"   }, color: "text-brand-green"  },
    premarket:  { dot: "bg-brand-yellow animate-pulse", label: { he: "פריי מרקט",  en: "Pre-Market"    }, color: "text-brand-yellow" },
    afterhours: { dot: "bg-orange-400 animate-pulse",  label: { he: "אחרי שוק",   en: "After Hours"   }, color: "text-orange-400"   },
    closed:     { dot: "bg-gray-500",                  label: { he: "שוק סגור",   en: "Market Closed" }, color: "text-gray-400"     },
  }[status];

  const nextLabel = nextEvent === "open"
    ? (lang === "he" ? "נפתח בעוד" : "Opens in")
    : (lang === "he" ? "נסגר בעוד" : "Closes in");

  return (
    <div className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-xl px-3 py-2 mb-3">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
      <span className={`text-xs font-semibold ${statusConfig.color}`}>
        {statusConfig.label[lang]}
      </span>
      <div className="flex items-center gap-1 ms-auto">
        <Clock size={11} className="text-gray-500" />
        <span className="text-gray-400 text-[10px]">{nextLabel}</span>
        <span className="text-white text-xs font-bold tabular-nums">{fmt(msUntil)}</span>
      </div>
    </div>
  );
}
