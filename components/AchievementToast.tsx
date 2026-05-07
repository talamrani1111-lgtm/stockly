"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import type { Badge } from "@/lib/gamification";

type Props = { badges: Badge[]; onDone: () => void };

export default function AchievementToast({ badges, onDone }: Props) {
  const { lang } = useApp();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!badges.length) { onDone(); return; }
    const t = setTimeout(() => {
      if (index < badges.length - 1) {
        setVisible(false);
        setTimeout(() => { setIndex(i => i + 1); setVisible(true); }, 300);
      } else {
        setVisible(false);
        setTimeout(onDone, 300);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [index, badges.length]); // eslint-disable-line

  if (!badges.length) return null;
  const badge = badges[index];

  return (
    <div className={`fixed top-20 left-4 right-4 max-w-md mx-auto z-50 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
      <div className="bg-brand-surface border border-brand-accent/40 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-accent/15 flex items-center justify-center text-2xl flex-shrink-0">
          {badge.emoji}
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-brand-accent font-semibold uppercase tracking-wide mb-0.5">
            {lang === "he" ? "🏆 הישג חדש!" : "🏆 Achievement Unlocked!"}
          </p>
          <p className="text-white font-bold text-sm">{badge.name[lang]}</p>
          <p className="text-gray-400 text-xs">{badge.desc[lang]}</p>
        </div>
      </div>
    </div>
  );
}
