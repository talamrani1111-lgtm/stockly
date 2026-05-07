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
import WatchlistTab from "@/components/WatchlistTab";
import ChatBot from "@/components/ChatBot";
import LearnTab from "@/components/LearnTab";
import { BarChart2, Newspaper, LineChart, Bitcoin, GraduationCap, MoreHorizontal, Bookmark, TrendingUp, Calendar, Sun, MessageCircle, X } from "lucide-react";

type Tab = "portfolio" | "watchlist" | "charts" | "today" | "news" | "screener" | "calendar" | "crypto" | "chat" | "learn";
const TAB_ORDER: Tab[] = ["portfolio", "charts", "news", "learn", "crypto", "watchlist", "today", "screener", "calendar", "chat"];

const PRIMARY_TABS: Tab[] = ["portfolio", "charts", "news", "learn", "crypto"];

export default function Home() {
  const { t, isRTL, lang } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [tappedNav, setTappedNav] = useState<string | null>(null);
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

  const allTabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "portfolio", label: t("portfolio_tab"), icon: <BarChart2 size={22} /> },
    { key: "charts",    label: t("charts_tab"),    icon: <LineChart size={22} /> },
    { key: "news",      label: t("news_tab"),      icon: <Newspaper size={22} /> },
    { key: "learn",     label: t("learn_tab"),     icon: <GraduationCap size={22} /> },
    { key: "crypto",    label: t("crypto_tab"),    icon: <Bitcoin size={22} /> },
    { key: "watchlist", label: t("watchlist_tab"), icon: <Bookmark size={22} /> },
    { key: "today",     label: t("today_tab"),     icon: <Sun size={22} /> },
    { key: "screener",  label: t("screener_tab"),  icon: <TrendingUp size={22} /> },
    { key: "calendar",  label: t("calendar_tab"),  icon: <Calendar size={22} /> },
    { key: "chat",      label: t("chat_tab"),      icon: <MessageCircle size={22} /> },
  ];

  const primaryTabs = allTabs.filter(t => PRIMARY_TABS.includes(t.key));
  const moreTabs = allTabs.filter(t => !PRIMARY_TABS.includes(t.key));
  const isMoreActive = moreTabs.some(t => t.key === activeTab);

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setShowMore(false);
    setTappedNav(tab);
    setTimeout(() => setTappedNav(null), 260);
    navigator.vibrate?.(8);
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col max-w-md mx-auto relative" dir={isRTL ? "rtl" : "ltr"}>
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      <MarketHeader
        onLogout={() => { localStorage.removeItem("auth_token"); setAuthed(false); }}
        onSearch={() => setShowSearch(true)}
      />

      <TickerTape />

      {/* Content */}
      <main
        key={activeTab}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-24 tab-enter"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === "portfolio" && <><DailyTip /><Portfolio /></>}
        {activeTab === "watchlist" && <WatchlistTab />}
        {activeTab === "charts"    && <ChartsTab />}
        {activeTab === "today"     && <DailySummary />}
        {activeTab === "news"      && <NewsFeed />}
        {activeTab === "screener"  && <Screener />}
        {activeTab === "calendar"  && <EventCalendar />}
        {activeTab === "crypto"    && <CryptoTab />}
        {activeTab === "chat"      && <ChatBot />}
        {activeTab === "learn"     && <LearnTab />}
      </main>

      {/* More sheet */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-20 left-0 right-0 max-w-md mx-auto px-4"
            onClick={e => e.stopPropagation()}>
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                  {lang === "he" ? "עוד" : "More"}
                </span>
                <button onClick={() => setShowMore(false)} className="text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {moreTabs.map(tab => (
                  <button key={tab.key} onClick={() => selectTab(tab.key)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all ${
                      activeTab === tab.key
                        ? "bg-brand-accent/15 text-brand-accent"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}>
                    {tab.icon}
                    <span className="text-[10px] font-semibold whitespace-nowrap">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30">
        <div className="bg-brand-surface/95 backdrop-blur-md border-t border-brand-border">
          <div className="flex">
            {primaryTabs.map(tab => (
              <button key={tab.key} onClick={() => selectTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors relative ${
                  tappedNav === tab.key ? "nav-tap" : ""
                } ${activeTab === tab.key ? "text-brand-accent" : "text-gray-500 hover:text-gray-300"}`}>
                {tab.icon}
                <span className="text-[9px] font-semibold">{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-brand-accent rounded-full" />
                )}
              </button>
            ))}

            {/* More button */}
            <button onClick={() => { setShowMore(v => !v); navigator.vibrate?.(8); }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors relative ${
                isMoreActive || showMore ? "text-brand-accent" : "text-gray-500 hover:text-gray-300"
              }`}>
              <MoreHorizontal size={22} />
              <span className="text-[9px] font-semibold">{lang === "he" ? "עוד" : "More"}</span>
              {isMoreActive && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-brand-accent rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
