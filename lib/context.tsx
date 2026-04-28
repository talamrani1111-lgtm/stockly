"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Lang, translations, TranslationKey } from "./i18n";

export type PortfolioItem = {
  symbol: string;
  shares: number;
  avgPrice: number;
  currency?: "USD" | "ILS";
  manualPrice?: number;
};

export type PriceAlert = {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: "above" | "below";
  triggered: boolean;
  createdAt: number;
};

export type CustomSector = { name: string; symbols: string[] };

export type CryptoItem = {
  id: string;       // coingecko id e.g. "bitcoin"
  symbol: string;   // e.g. "BTC"
  amount: number;
  avgPrice: number;
};

type AppContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  portfolio: PortfolioItem[];
  setPortfolio: (p: PortfolioItem[]) => void;
  watchlist: string[];
  setWatchlist: (w: string[]) => void;
  selectedSectors: string[];
  setSelectedSectors: (s: string[]) => void;
  customSectors: CustomSector[];
  setCustomSectors: (s: CustomSector[]) => void;
  alerts: PriceAlert[];
  setAlerts: (a: PriceAlert[]) => void;
  cryptoPortfolio: CryptoItem[];
  setCryptoPortfolio: (c: CryptoItem[]) => void;
};

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SECTORS = ["technology", "ai", "space"];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("he");
  const [portfolio, setPortfolioState] = useState<PortfolioItem[]>([]);
  const [watchlist, setWatchlistState] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectorsState] = useState<string[]>(DEFAULT_SECTORS);
  const [customSectors, setCustomSectorsState] = useState<CustomSector[]>([]);
  const [alerts, setAlertsState] = useState<PriceAlert[]>([]);
  const [cryptoPortfolio, setCryptoPortfolioState] = useState<CryptoItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("app_state");
    if (stored) {
      const s = JSON.parse(stored);
      if (s.lang) setLangState(s.lang);
      if (s.portfolio) setPortfolioState(s.portfolio);
      if (s.watchlist) setWatchlistState(s.watchlist);
      if (s.selectedSectors) setSelectedSectorsState(s.selectedSectors);
      if (s.customSectors) setCustomSectorsState(s.customSectors);
      if (s.alerts) setAlertsState(s.alerts);
      if (s.cryptoPortfolio) setCryptoPortfolioState(s.cryptoPortfolio);
    }
    // Load portfolio from server.
    // Server returns [] for authenticated users with no data, or null for unauthenticated.
    // Only update state when server returns an array (even empty) — never wipe on null.
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (token) {
      fetch("/api/portfolio", { headers: { "Authorization": `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setPortfolioState(data); })
        .catch(() => {});
    }
  }, []);

  function persist(patch: object) {
    const existing = JSON.parse(localStorage.getItem("app_state") ?? "{}");
    localStorage.setItem("app_state", JSON.stringify({ ...existing, ...patch }));
  }

  function setLang(l: Lang) { setLangState(l); persist({ lang: l }); }
  function setPortfolio(p: PortfolioItem[]) {
    setPortfolioState(p);
    persist({ portfolio: p });
    // Sync to server
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(p),
      }).catch(() => {});
    }
  }
  function setWatchlist(w: string[]) { setWatchlistState(w); persist({ watchlist: w }); }
  function setSelectedSectors(s: string[]) { setSelectedSectorsState(s); persist({ selectedSectors: s }); }
  function setCustomSectors(s: CustomSector[]) { setCustomSectorsState(s); persist({ customSectors: s }); }
  function setAlerts(a: PriceAlert[]) { setAlertsState(a); persist({ alerts: a }); }
  function setCryptoPortfolio(c: CryptoItem[]) { setCryptoPortfolioState(c); persist({ cryptoPortfolio: c }); }

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }

  return (
    <AppContext.Provider value={{
      lang, setLang, t, isRTL: lang === "he",
      portfolio, setPortfolio,
      watchlist, setWatchlist,
      selectedSectors, setSelectedSectors,
      customSectors, setCustomSectors,
      alerts, setAlerts,
      cryptoPortfolio, setCryptoPortfolio,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
