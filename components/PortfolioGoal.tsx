"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { Target, Pencil, Check } from "lucide-react";
import clsx from "clsx";

export default function PortfolioGoal({ currentValue }: { currentValue: number }) {
  const { lang, isRTL } = useApp();
  const [goal, setGoal] = useState(0);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    const g = parseFloat(localStorage.getItem("portfolio_goal") ?? "0");
    setGoal(g);
  }, []);

  function save() {
    const val = parseFloat(input.replace(/,/g, ""));
    if (val > 0) {
      setGoal(val);
      localStorage.setItem("portfolio_goal", String(val));
    }
    setEditing(false);
  }

  if (!goal && !editing) {
    return (
      <button onClick={() => { setEditing(true); setInput(""); }}
        className="w-full flex items-center gap-2 bg-brand-card border border-dashed border-brand-border rounded-2xl px-4 py-3 text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-all mb-4">
        <Target size={15} />
        <span className="text-sm">{lang === "he" ? "הגדר יעד לתיק..." : "Set a portfolio goal..."}</span>
      </button>
    );
  }

  if (editing) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl px-4 py-3 mb-4 flex items-center gap-2" dir={isRTL ? "rtl" : "ltr"}>
        <Target size={15} className="text-brand-accent flex-shrink-0" />
        <span className="text-gray-400 text-sm">$</span>
        <input autoFocus type="number" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          placeholder={lang === "he" ? "יעד בדולרים..." : "Goal in USD..."}
          className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600" />
        <button onClick={save} className="text-brand-accent hover:text-white transition-colors">
          <Check size={16} />
        </button>
      </div>
    );
  }

  const pct = Math.min((currentValue / goal) * 100, 100);
  const remaining = Math.max(goal - currentValue, 0);
  const done = currentValue >= goal;

  return (
    <div className={clsx("bg-brand-card border rounded-2xl px-4 py-3 mb-4", done ? "border-brand-green/30" : "border-brand-border")}
      dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Target size={13} className={done ? "text-brand-green" : "text-brand-accent"} />
          <span className="text-gray-400 text-xs font-semibold">
            {lang === "he" ? "יעד תיק" : "Portfolio Goal"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx("text-xs font-bold", done ? "text-brand-green" : "text-white")}>
            ${goal.toLocaleString()}
          </span>
          <button onClick={() => { setEditing(true); setInput(String(goal)); }}
            className="text-gray-600 hover:text-gray-300 transition-colors">
            <Pencil size={12} />
          </button>
        </div>
      </div>

      <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
        <div className={clsx("h-full rounded-full transition-all duration-700", done ? "bg-brand-green" : "bg-brand-accent")}
          style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-between">
        <span className={clsx("text-xs font-bold", done ? "text-brand-green" : "text-brand-accent")}>
          {pct.toFixed(0)}%
        </span>
        <span className="text-gray-500 text-[10px]">
          {done
            ? (lang === "he" ? "🎉 הגעת ליעד!" : "🎉 Goal reached!")
            : (lang === "he" ? `נשאר $${remaining.toLocaleString("en", { maximumFractionDigits: 0 })}` : `$${remaining.toLocaleString("en", { maximumFractionDigits: 0 })} to go`)}
        </span>
      </div>
    </div>
  );
}
