"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { getBadges, getXP, xpLevel, getStreak, type Badge } from "@/lib/gamification";
import { Award, Flame, Zap } from "lucide-react";

export default function BadgesPanel() {
  const { lang, isRTL } = useApp();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setBadges(getBadges());
    setXp(getXP());
    setStreak(getStreak().current);
  }, []);

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);
  const { level, label, nextAt } = xpLevel(xp);
  const prevAt = [0, 100, 300, 700, 1500, 3000][level - 1] ?? 0;
  const progress = nextAt > prevAt ? ((xp - prevAt) / (nextAt - prevAt)) * 100 : 100;

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header row */}
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Award size={16} className="text-brand-accent" />
          <span className="text-white text-sm font-semibold">
            {lang === "he" ? "הישגים ורמה" : "Achievements & Level"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Flame size={13} />
              <span className="text-xs font-bold">{streak}</span>
            </div>
          )}
          <span className="text-gray-500 text-xs">{earned.length}/{badges.length}</span>
          <span className="text-gray-500 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* XP bar always visible */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-brand-accent" />
            <span className="text-brand-accent text-[10px] font-bold">
              {lang === "he" ? `רמה ${level} · ${label.he}` : `Level ${level} · ${label.en}`}
            </span>
          </div>
          <span className="text-gray-500 text-[10px]">{xp} / {nextAt} XP</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-brand-accent rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>

      {open && (
        <>
          {/* Earned badges */}
          {earned.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mb-2">
                {lang === "he" ? "הושגו" : "Earned"} ({earned.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {earned.map(b => (
                  <div key={b.id} className="flex items-center gap-1.5 bg-brand-accent/10 border border-brand-accent/25 rounded-xl px-2.5 py-1.5" title={b.desc[lang]}>
                    <span className="text-base">{b.emoji}</span>
                    <span className="text-white text-[10px] font-semibold">{b.name[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked badges */}
          {locked.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-2">
                {lang === "he" ? "עדיין לא" : "Locked"} ({locked.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {locked.map(b => (
                  <div key={b.id} className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2.5 py-1.5 opacity-50" title={b.desc[lang]}>
                    <span className="text-base grayscale">{b.emoji}</span>
                    <span className="text-gray-500 text-[10px]">{b.name[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
