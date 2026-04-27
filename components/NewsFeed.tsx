"use client";
import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/lib/context";
import { ExternalLink, RefreshCw, Globe, TrendingUp } from "lucide-react";
import { SECTOR_SYMBOLS } from "@/lib/finnhub";

type NewsItem = {
  id: number | string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  related?: string;
  image?: string;
  lang?: "he" | "en";
};

function timeAgo(ts: number, lang: string): string {
  const diff = Math.floor((Date.now() / 1000 - ts) / 60);
  if (lang === "he") {
    if (diff < 1) return "עכשיו";
    if (diff < 60) return `לפני ${diff} דק'`;
    if (diff < 1440) return `לפני ${Math.floor(diff / 60)} שע'`;
    return `לפני ${Math.floor(diff / 1440)} ימים`;
  }
  if (diff < 1) return "now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const POSITIVE_WORDS = ["surge", "soar", "rally", "gain", "rise", "beat", "record", "profit", "growth", "upgrade", "bull", "strong", "high", "boost", "buy", "outperform", "עלייה", "זינוק", "שיא", "רווח", "עולה", "חיובי", "שדרוג"];
const NEGATIVE_WORDS = ["crash", "fall", "drop", "decline", "loss", "miss", "cut", "warn", "fear", "sell", "downgrade", "weak", "low", "bear", "risk", "deficit", "ירידה", "נפילה", "הפסד", "סיכון", "שלילי", "הורדה", "חשש"];

function getSentiment(headline: string): "positive" | "negative" | "neutral" {
  const text = headline.toLowerCase();
  const pos = POSITIVE_WORDS.filter(w => text.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter(w => text.includes(w)).length;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

function NewsCard({ item, lang }: { item: NewsItem; lang: string }) {
  const sentiment = getSentiment(item.headline);
  const sentimentBorder = sentiment === "positive" ? "border-brand-green/20 hover:border-brand-green/40"
    : sentiment === "negative" ? "border-brand-red/20 hover:border-brand-red/30"
    : "border-brand-border hover:border-brand-accent/30";
  const sentimentDot = sentiment === "positive" ? "bg-brand-green"
    : sentiment === "negative" ? "bg-brand-red"
    : null;

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className={`group bg-brand-card border ${sentimentBorder} rounded-2xl p-4 flex gap-3 transition-all hover:bg-white/[0.03]`}
      dir={item.lang === "he" ? "rtl" : "ltr"}>
      {item.image && (
        <img src={item.image} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 opacity-90"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1.5">
          {sentimentDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${sentimentDot}`} />}
          <p className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand-accent transition-colors">
            {item.headline}
          </p>
        </div>
        {item.summary && (
          <p className="text-gray-500 text-xs line-clamp-2 mb-2 leading-relaxed">{item.summary}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-brand-accent/70 text-xs font-medium bg-brand-accent/10 px-2 py-0.5 rounded-lg">
            {item.source}
          </span>
          <span className="text-gray-600 text-xs">{timeAgo(item.datetime, lang)}</span>
          {item.related && (
            <span className="text-gray-500 text-xs bg-white/5 px-2 py-0.5 rounded-lg">{item.related}</span>
          )}
          <ExternalLink size={10} className="text-gray-600 ms-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </a>
  );
}

type FilterType = "portfolio" | "sectors" | "hebrew" | "all";

export default function NewsFeed() {
  const { t, lang, isRTL, portfolio, selectedSectors } = useApp();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("portfolio");

  const portfolioSymbols = portfolio.map((p) => p.symbol);
  const sectorSymbols = [...new Set(selectedSectors.flatMap((s) => SECTOR_SYMBOLS[s] ?? []))];

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/news?";
      if (filter === "hebrew") {
        const res = await fetch("/api/news-hebrew");
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
        setLoading(false);
        return;
      }
      if (filter === "portfolio") url += `symbols=${portfolioSymbols.join(",")}`;
      else if (filter === "sectors") url += `symbols=${sectorSymbols.join(",")}`;
      else url += "general=true";

      const res = await fetch(url);
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch {
      setNews([]);
    }
    setLoading(false);
  }, [filter, portfolioSymbols.join(","), sectorSymbols.join(",")]); // eslint-disable-line

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const filterOptions: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: "portfolio", label: t("portfolio"), icon: <TrendingUp size={11} /> },
    { key: "sectors", label: t("sectors"), icon: <TrendingUp size={11} /> },
    { key: "hebrew", label: lang === "he" ? "עברית" : "Hebrew", icon: <Globe size={11} /> },
    { key: "all", label: lang === "he" ? "כללי" : "General", icon: <Globe size={11} /> },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filterOptions.map((opt) => (
          <button key={opt.key} onClick={() => setFilter(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              filter === opt.key
                ? "bg-brand-accent text-white shadow-glow"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/8"
            }`}>
            {opt.icon}{opt.label}
          </button>
        ))}
        <button onClick={fetchNews}
          className="ms-auto flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <div className="shimmer h-4 w-full mb-2 rounded" />
              <div className="shimmer h-3 w-3/4 mb-3 rounded" />
              <div className="shimmer h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
            <Globe size={20} className="text-gray-500" />
          </div>
          <p className="text-gray-500 text-sm">{t("noNews")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {news.map((item, i) => <NewsCard key={`${item.id}-${i}`} item={item} lang={lang} />)}
        </div>
      )}
    </div>
  );
}
