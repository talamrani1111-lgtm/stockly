"use client";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import MarketHeader from "@/components/MarketHeader";
import Portfolio from "@/components/Portfolio";
import NewsFeed from "@/components/NewsFeed";
import Screener from "@/components/Screener";
import EventCalendar from "@/components/EventCalendar";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";
import DailyTip from "@/components/DailyTip";
import TickerTape from "@/components/TickerTape";
import ChartsTab from "@/components/ChartsTab";
import DailySummary from "@/components/DailySummary";
import GlobalSearch from "@/components/GlobalSearch";
import CryptoTab from "@/components/CryptoTab";
import { BarChart2, Newspaper, TrendingUp, Calendar, LineChart, Sun, Bitcoin } from "lucide-react";

type Tab = "portfolio" | "charts" | "today" | "news" | "screener" | "calendar" | "crypto";
const TAB_ORDER: Tab[] = ["portfolio", "charts", "today", "news", "screener", "calendar", "crypto"];

export default function Home() {
  const { t, isRTL, lang } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (!token) { setAuthed(false); return; }
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => setAuthed(d.valid === true))
      .catch(() => setAuthed(false));
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const idx = TAB_ORDER.indexOf(activeTab);
    const next = isRTL ? dx > 0 : dx < 0;
    if (next && idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
    if (!next && idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    if (showRegister) {
      return <RegisterScreen lang={lang} onBack={() => setShowRegister(false)} onRegistered={() => { setShowRegister(false); setAuthed(true); }} />;
    }
    return <LoginScreen lang={lang} onLogin={() => setAuthed(true)} onRegister={() => setShowRegister(true)} />;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "portfolio", label: t("portfolio_tab"), icon: <BarChart2 size={18} /> },
    { key: "charts",    label: t("charts_tab"),    icon: <LineChart size={18} /> },
    { key: "today",     label: t("today_tab"),     icon: <Sun size={18} /> },
    { key: "news",      label: t("news_tab"),      icon: <Newspaper size={18} /> },
    { key: "screener",  label: t("screener_tab"),  icon: <TrendingUp size={18} /> },
    { key: "calendar",  label: t("calendar_tab"),  icon: <Calendar size={18} /> },
    { key: "crypto",    label: t("crypto_tab"),    icon: <Bitcoin size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col max-w-md mx-auto relative" dir={isRTL ? "rtl" : "ltr"}>
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      <MarketHeader
        onLogout={() => { localStorage.removeItem("auth_token"); setAuthed(false); }}
        onSearch={() => setShowSearch(true)}
      />

      <TickerTape />

      {/* Tab bar */}
      <div className="bg-brand-surface border-b border-brand-border sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 transition-all relative min-w-[56px] ${
                activeTab === tab.key ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              <span className={activeTab === tab.key ? "tab-glow text-brand-accent" : ""}>{tab.icon}</span>
              <span className="text-[9px] font-semibold whitespace-nowrap">{tab.label}</span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-brand-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main
        className="flex-1 overflow-y-auto px-4 pt-4 pb-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === "portfolio" && <><DailyTip /><Portfolio /></>}
        {activeTab === "charts"    && <ChartsTab />}
        {activeTab === "today"     && <DailySummary />}
        {activeTab === "news"      && <NewsFeed />}
        {activeTab === "screener"  && <Screener />}
        {activeTab === "calendar"  && <EventCalendar />}
        {activeTab === "crypto"    && <CryptoTab />}
      </main>
    </div>
  );
}
