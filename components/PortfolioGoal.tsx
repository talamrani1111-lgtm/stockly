"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { Target, Pencil, Check, X } from "lucide-react";
import clsx from "clsx";

const GOAL_PRESETS = [
  { label: "$10K",    value: 10_000  },
  { label: "$25K",    value: 25_000  },
  { label: "$50K",    value: 50_000  },
  { label: "$100K",   value: 100_000 },
  { label: "$250K",   value: 250_000 },
  { label: "$500K",   value: 500_000 },
  { label: "$1M",     value: 1_000_000 },
];

function smartPresets(current: number) {
  if (current <= 0) return GOAL_PRESETS;
  // Show presets that are above current value; also add dynamic multiples
  const filtered = GOAL_PRESETS.filter(p => p.value > current);
  // If current is above $1M, add custom multipliers
  if (!filtered.length) {
    return [
      { label: "×1.5", value: Math.round(current * 1.5 / 1000) * 1000 },
      { label: "×2",   value: Math.round(current * 2   / 1000) * 1000 },
      { label: "×5",   value: Math.round(current * 5   / 1000) * 1000 },
    ];
  }
  return filtered;
}

export default function PortfolioGoal({ currentValue }: { currentValue: number }) {
  const { lang, isRTL } = useApp();
  const [goal, setGoal] = useState(0);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const isHe = lang === "he";

  useEffect(() => {
    const g = parseFloat(localStorage.getItem("portfolio_goal") ?? "0");
    setGoal(g);
  }, []);

  function pickPreset(val: number) {
    setGoal(val);
    localStorage.setItem("portfolio_goal", String(val));
    setEditing(false);
  }

  function saveCustom() {
    const val = parseFloat(input.replace(/,/g, ""));
    if (val > 0) {
      setGoal(val);
      localStorage.setItem("portfolio_goal", String(val));
    }
    setEditing(false);
  }

  function clearGoal() {
    setGoal(0);
    localStorage.removeItem("portfolio_goal");
    setEditing(false);
  }

  const presets = smartPresets(currentValue);

  // ── No goal set: show invitation ────────────────────────────────
  if (!goal && !editing) {
    return (
      <div className="bg-brand-card border border-dashed border-brand-border rounded-2xl p-4 mb-4"
        dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-brand-accent" />
          <p className="text-gray-400 text-xs font-semibold">
            {isHe ? "הגדר יעד לתיק" : "Set a portfolio goal"}
          </p>
        </div>
        {/* Quick preset buttons */}
        <div className="flex gap-2 flex-wrap mb-3">
          {presets.map(p => (
            <button key={p.value} onClick={() => pickPreset(p.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20 transition-colors">
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(true); setInput(""); }}
          className="text-gray-600 text-[10px] hover:text-gray-400 transition-colors flex items-center gap-1">
          <Pencil size={9} />
          {isHe ? "הזן סכום מותאם אישית..." : "Enter custom amount..."}
        </button>
      </div>
    );
  }

  // ── Editing mode ─────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-brand-accent" />
          <p className="text-gray-400 text-xs font-semibold">{isHe ? "בחר יעד" : "Choose a goal"}</p>
          <button onClick={() => setEditing(false)} className="text-gray-600 hover:text-gray-300 ms-auto">
            <X size={14} />
          </button>
        </div>

        {/* Preset grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {presets.map(p => (
            <button key={p.value} onClick={() => pickPreset(p.value)}
              className={clsx(
                "py-2.5 rounded-xl text-xs font-bold border transition-all",
                goal === p.value
                  ? "bg-brand-accent border-brand-accent text-white"
                  : "bg-brand-accent/8 border-brand-accent/20 text-brand-accent hover:bg-brand-accent/15"
              )}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-xl px-3 py-2">
          <span className="text-gray-500 text-sm">$</span>
          <input
            autoFocus
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveCustom()}
            placeholder={isHe ? "סכום מותאם..." : "Custom amount..."}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"
          />
          <button onClick={saveCustom} className="text-brand-accent hover:text-white transition-colors">
            <Check size={15} />
          </button>
        </div>

        {goal > 0 && (
          <button onClick={clearGoal}
            className="mt-2 text-gray-600 text-[10px] hover:text-brand-red transition-colors flex items-center gap-1">
            <X size={9} />{isHe ? "הסר יעד" : "Remove goal"}
          </button>
        )}
      </div>
    );
  }

  // ── Goal active ──────────────────────────────────────────────────
  const pct       = Math.min((currentValue / goal) * 100, 100);
  const remaining = Math.max(goal - currentValue, 0);
  const done      = currentValue >= goal;

  // Progress segments: 25%, 50%, 75%, 100%
  const milestones = [25, 50, 75, 100];

  return (
    <div className={clsx("bg-brand-card border rounded-2xl p-4 mb-4",
      done ? "border-brand-green/30" : "border-brand-border")}
      dir={isRTL ? "rtl" : "ltr"}>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Target size={13} className={done ? "text-brand-green" : "text-brand-accent"} />
          <span className="text-gray-400 text-xs font-semibold">
            {isHe ? "יעד תיק" : "Portfolio Goal"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx("text-sm font-bold", done ? "text-brand-green" : "text-white")}>
            ${goal >= 1_000_000
              ? `${(goal / 1_000_000).toFixed(1)}M`
              : goal >= 1_000
              ? `${(goal / 1_000).toFixed(0)}K`
              : goal.toLocaleString()}
          </span>
          <button onClick={() => { setEditing(true); setInput(String(goal)); }}
            className="text-gray-600 hover:text-gray-300 transition-colors p-1">
            <Pencil size={11} />
          </button>
        </div>
      </div>

      {/* Progress bar with milestones */}
      <div className="relative mb-2">
        <div className="h-3 bg-white/8 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all duration-700",
              done ? "bg-brand-green" : pct >= 75 ? "bg-brand-accent" : pct >= 50 ? "bg-brand-accent/80" : "bg-brand-accent/60")}
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Milestone ticks */}
        {milestones.slice(0, -1).map(m => (
          <div key={m}
            className={clsx("absolute top-0 bottom-0 w-px", pct >= m ? "bg-white/20" : "bg-white/10")}
            style={{ left: `${m}%` }}
          />
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className={clsx("text-sm font-bold", done ? "text-brand-green" : "text-brand-accent")}>
            {pct.toFixed(1)}%
          </span>
          <span className="text-gray-600 text-[10px] ms-1">
            ${currentValue >= 1000 ? `${(currentValue / 1000).toFixed(1)}K` : currentValue.toFixed(0)}
          </span>
        </div>
        <span className="text-gray-500 text-[10px]">
          {done
            ? (isHe ? "🎉 הגעת ליעד!" : "🎉 Goal reached!")
            : isHe
            ? `נשאר $${remaining >= 1000 ? `${(remaining / 1000).toFixed(0)}K` : remaining.toFixed(0)}`
            : `$${remaining >= 1000 ? `${(remaining / 1000).toFixed(0)}K` : remaining.toFixed(0)} to go`}
        </span>
      </div>

      {/* Milestone chips */}
      <div className="flex gap-1.5">
        {milestones.map(m => (
          <div key={m} className={clsx(
            "flex-1 text-center py-1 rounded-lg text-[9px] font-bold transition-all",
            pct >= m
              ? done ? "bg-brand-green/20 text-brand-green" : "bg-brand-accent/20 text-brand-accent"
              : "bg-white/5 text-gray-700"
          )}>
            {pct >= m ? "✓" : ""}{m}%
          </div>
        ))}
      </div>
    </div>
  );
}
