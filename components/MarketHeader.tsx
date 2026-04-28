"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { Globe, Zap, AlertTriangle, TrendingUp, TrendingDown, Minus, LogOut, Search } from "lucide-react";
import NotificationButton from "@/components/NotificationButton";

type HeaderData = {
  forex: number | null;
  vix: number | null;
  marketStatus: string;
};

function getMarketStatus(): string {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nyTime.getDay();
  const hour = nyTime.getHours();
  const min = nyTime.getMinutes();
  const mins = hour * 60 + min;
  if (day === 0 || day === 6) return "closed";
  if (mins >= 9 * 60 + 30 && mins < 16 * 60) return "open";
  if (mins >= 4 * 60 && mins < 9 * 60 + 30) return "premarket";
  if (mins >= 16 * 60 && mins < 20 * 60) return "afterhours";
  return "closed";
}

function getGreeting(isRTL: boolean): string {
  const h = new Date().getHours();
  if (isRTL) {
    if (h >= 5 && h < 12) return "בוקר טוב";
    if (h >= 12 && h < 17) return "צהריים טובים";
    if (h >= 17 && h < 21) return "ערב טוב";
    return "לילה טוב";
  }
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

export default function MarketHeader({ onLogout, onSearch }: { onLogout?: () => void; onSearch?: () => void }) {
  const { t, lang, setLang, isRTL } = useApp();
  const [data, setData] = useState<HeaderData>({ forex: null, vix: null, marketStatus: "closed" });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("user_name") ?? "");
    const status = getMarketStatus();
    Promise.all([
      fetch("/api/forex").then((r) => r.json()).catch(() => ({ rate: null })),
      fetch("/api/stocks?symbols=VIX").then((r) => r.json()).catch(() => []),
    ]).then(([forex, stocks]) => {
      const vixData = Array.isArray(stocks) ? stocks[0] : null;
      setData({ forex: forex.rate, vix: vixData?.price ?? null, marketStatus: status });
    });
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const statusConfig = {
    open: { color: "text-brand-green", bg: "bg-brand-green/10", dot: "bg-brand-green", label: t("open"), Icon: TrendingUp },
    premarket: { color: "text-brand-yellow", bg: "bg-brand-yellow/10", dot: "bg-brand-yellow", label: t("preMarket"), Icon: TrendingUp },
    afterhours: { color: "text-blue-400", bg: "bg-blue-400/10", dot: "bg-blue-400", label: t("afterHours"), Icon: Minus },
    closed: { color: "text-gray-500", bg: "bg-gray-500/10", dot: "bg-gray-500", label: t("closed"), Icon: TrendingDown },
  }[data.marketStatus] ?? { color: "text-gray-500", bg: "bg-gray-500/10", dot: "bg-gray-500", label: t("closed"), Icon: Minus };

  const vixColor = data.vix ? (data.vix > 25 ? "text-brand-red" : data.vix < 15 ? "text-brand-green" : "text-brand-yellow") : "text-gray-500";

  return (
    <div className="bg-brand-surface border-b border-brand-border px-4 py-4 pt-safe" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Stockly" className="w-8 h-8 rounded-xl" />
            <h1 className="text-white font-bold text-xl tracking-tight">{t("appTitle")}</h1>
          </div>
          <p className="text-gray-400 text-xs mt-0.5 font-medium">
            {getGreeting(isRTL)}{userName ? `, ${userName}` : ""} ·{" "}
            <span className="text-gray-600">{dateStr}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationButton />
          {onSearch && (
            <button onClick={onSearch}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl px-2.5 py-1.5 transition-all">
              <Search size={14} />
            </button>
          )}
          <button
            onClick={() => setLang(lang === "he" ? "en" : "he")}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
          >
            <Globe size={12} />
            {lang === "he" ? "EN" : "עב"}
          </button>
          {onLogout && (
            <button onClick={onLogout}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-xl px-2.5 py-1.5 text-xs transition-all">
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Market status */}
        <div className={`flex items-center gap-1.5 ${statusConfig.bg} rounded-xl px-3 py-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${data.marketStatus === "open" ? "pulse-dot" : ""}`} />
          <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>

        {/* USD/ILS */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5">
          <span className="text-gray-400 text-xs">₪/$</span>
          <span className="text-white text-xs font-bold">
            {data.forex ? data.forex.toFixed(3) : "—"}
          </span>
        </div>

        {/* VIX */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5">
          <AlertTriangle size={10} className={vixColor} />
          <span className="text-gray-400 text-xs">VIX</span>
          <span className={`text-xs font-bold ${vixColor}`}>
            {data.vix ? data.vix.toFixed(1) : "—"}
          </span>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 ms-auto">
          <Zap size={10} className="text-brand-accent" />
          <span className="text-gray-500 text-xs">Live</span>
        </div>
      </div>
    </div>
  );
}
