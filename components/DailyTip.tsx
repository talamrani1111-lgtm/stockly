"use client";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { getDailyTip, tips } from "@/lib/tips";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";

export default function DailyTip() {
  const { lang, isRTL } = useApp();
  const [index, setIndex] = useState(() => {
    const day = new Date().getDay() + new Date().getDate();
    return day % tips.length;
  });

  const tip = tips[index][lang];
  const label = lang === "he" ? "טיפ יומי" : "Daily Tip";

  function prev() { setIndex((i) => (i - 1 + tips.length) % tips.length); }
  function next() { setIndex((i) => (i + 1) % tips.length); }

  return (
    <div className="bg-brand-card border border-brand-yellow/20 rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
            <Lightbulb size={13} className="text-brand-yellow" />
          </div>
          <span className="text-brand-yellow text-xs font-semibold uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={isRTL ? next : prev}
            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={13} />
          </button>
          <button onClick={isRTL ? prev : next}
            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
      <p className="text-gray-600 text-xs mt-2">{index + 1} / {tips.length}</p>
    </div>
  );
}
