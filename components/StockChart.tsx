"use client";
import { useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import { X } from "lucide-react";

type Props = { symbol: string; onClose: () => void };

const TV_SYMBOLS: Record<string, string> = {
  "VOO": "AMEX:VOO",
  "QQQ": "NASDAQ:QQQ",
  "SOFI": "NASDAQ:SOFI",
  "TA-125": "TVC:TA125",
  "NVDA": "NASDAQ:NVDA",
  "AAPL": "NASDAQ:AAPL",
  "MSFT": "NASDAQ:MSFT",
  "GOOGL": "NASDAQ:GOOGL",
  "META": "NASDAQ:META",
  "AMZN": "NASDAQ:AMZN",
  "TSLA": "NASDAQ:TSLA",
  "PLTR": "NASDAQ:PLTR",
  "RKLB": "NASDAQ:RKLB",
  "AMD": "NASDAQ:AMD",
  "INTC": "NASDAQ:INTC",
};

function getTVSymbol(symbol: string): string {
  return TV_SYMBOLS[symbol.toUpperCase()] ?? `NASDAQ:${symbol}`;
}

declare global {
  interface Window {
    TradingView: { widget: new (config: object) => void };
  }
}

export default function StockChart({ symbol, onClose }: Props) {
  const { lang } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !containerRef.current) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: getTVSymbol(symbol),
        interval: "D",
        timezone: "Asia/Jerusalem",
        theme: "dark",
        style: "1",
        locale: lang === "he" ? "he_IL" : "en",
        toolbar_bg: "#0f1320",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        withdateranges: true,
        container_id: containerId,
        studies: ["RSI@tv-basicstudies"],
        disabled_features: ["header_symbol_search"],
        enabled_features: ["use_localstorage_for_settings"],
      });
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [symbol, lang, containerId]);

  return (
    <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-surface border-b border-brand-border">
        <div>
          <h2 className="text-white font-bold text-base">{symbol}</h2>
          <p className="text-gray-500 text-xs">{getTVSymbol(symbol)}</p>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* TradingView chart */}
      <div className="flex-1" ref={containerRef}>
        <div id={containerId} className="w-full h-full" />
      </div>
    </div>
  );
}
