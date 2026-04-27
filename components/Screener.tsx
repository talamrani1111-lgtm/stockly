"use client";
import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/lib/context";
import { TrendingUp, TrendingDown, RefreshCw, Flame, Plus, X, Check } from "lucide-react";
import clsx from "clsx";

type StockData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
};

const BUILTIN_SECTORS = ["technology", "energy", "construction", "ai", "space"] as const;
type BuiltinSector = (typeof BUILTIN_SECTORS)[number];

const SECTOR_EMOJIS: Record<BuiltinSector, string> = {
  technology: "💻", energy: "⚡", construction: "🏗️", ai: "🤖", space: "🚀",
};

export default function Screener() {
  const { t, isRTL, customSectors, setCustomSectors } = useApp();
  const [activeSector, setActiveSector] = useState<string>("technology");
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"all" | "gainers" | "losers">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [newSectorSymbols, setNewSectorSymbols] = useState("");

  const sectorLabels: Record<BuiltinSector, string> = {
    technology: t("technology"),
    energy: t("energy"),
    construction: t("construction"),
    ai: t("ai"),
    space: t("space"),
  };

  const fetchScreener = useCallback(async () => {
    setLoading(true);
    try {
      const custom = customSectors.find((s) => s.name === activeSector);
      let url: string;
      if (custom) {
        url = `/api/screener?symbols=${custom.symbols.join(",")}`;
      } else {
        url = `/api/screener?sector=${activeSector}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setStocks(Array.isArray(data) ? data : []);
    } catch {
      setStocks([]);
    }
    setLoading(false);
  }, [activeSector, customSectors]);

  useEffect(() => { fetchScreener(); }, [fetchScreener]);

  function addCustomSector() {
    const name = newSectorName.trim();
    const symbols = newSectorSymbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (!name || symbols.length === 0) return;
    setCustomSectors([...customSectors, { name, symbols }]);
    setActiveSector(name);
    setNewSectorName("");
    setNewSectorSymbols("");
    setShowAddForm(false);
  }

  function removeCustomSector(name: string) {
    setCustomSectors(customSectors.filter((s) => s.name !== name));
    if (activeSector === name) setActiveSector("technology");
  }

  const filtered = stocks.filter((s) => {
    if (mode === "gainers") return s.changePercent > 0;
    if (mode === "losers") return s.changePercent < 0;
    return true;
  });

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* Sector selector */}
      <div className="mb-4">
        <p className="text-gray-500 text-xs font-medium mb-2.5 uppercase tracking-wide">{t("selectSectors")}</p>
        <div className="flex flex-wrap gap-2">
          {BUILTIN_SECTORS.map((key) => (
            <button key={key} onClick={() => setActiveSector(key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                activeSector === key
                  ? "bg-brand-accent border-brand-accent text-white shadow-glow"
                  : "bg-white/5 border-white/8 text-gray-400 hover:text-white hover:bg-white/10"
              )}>
              <span>{SECTOR_EMOJIS[key]}</span>
              {sectorLabels[key]}
            </button>
          ))}

          {/* Custom sectors */}
          {customSectors.map((cs) => (
            <div key={cs.name} className={clsx(
              "flex items-center gap-1 rounded-xl border transition-all",
              activeSector === cs.name
                ? "bg-brand-accent/20 border-brand-accent/50"
                : "bg-white/5 border-white/8"
            )}>
              <button onClick={() => setActiveSector(cs.name)}
                className={clsx("px-3 py-1.5 text-xs font-semibold",
                  activeSector === cs.name ? "text-brand-accent" : "text-gray-400 hover:text-white")}>
                ✦ {cs.name}
              </button>
              <button onClick={() => removeCustomSector(cs.name)}
                className="pe-2 text-gray-600 hover:text-brand-red transition-colors">
                <X size={11} />
              </button>
            </div>
          ))}

          {/* Add sector button */}
          <button onClick={() => setShowAddForm(!showAddForm)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              showAddForm
                ? "bg-brand-accent/20 border-brand-accent/40 text-brand-accent"
                : "bg-white/5 border-white/8 text-gray-500 hover:text-white hover:bg-white/10"
            )}>
            <Plus size={11} />
            {isRTL ? "הוסף סקטור" : "Add Sector"}
          </button>
        </div>

        {/* Add sector form */}
        {showAddForm && (
          <div className="mt-3 bg-brand-card border border-brand-border rounded-2xl p-4">
            <p className="text-white text-sm font-semibold mb-3">
              {isRTL ? "סקטור מותאם אישית" : "Custom Sector"}
            </p>
            <div className="flex flex-col gap-2">
              <input
                className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
                placeholder={isRTL ? "שם הסקטור (לדוגמה: ביוטק)" : "Sector name (e.g. Biotech)"}
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
              />
              <input
                className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
                placeholder={isRTL ? "סימולים מופרדים בפסיק: MRNA,PFE,GILD" : "Symbols separated by comma: MRNA,PFE,GILD"}
                value={newSectorSymbols}
                onChange={(e) => setNewSectorSymbols(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={addCustomSector}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
                  <Check size={13} /> {isRTL ? "צור סקטור" : "Create Sector"}
                </button>
                <button onClick={() => setShowAddForm(false)}
                  className="px-4 rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white text-sm transition-colors">
                  {isRTL ? "ביטול" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mode filter */}
      <div className="flex items-center gap-2 mb-4">
        {(["all", "gainers", "losers"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              mode === m
                ? m === "gainers" ? "bg-brand-green/20 border-brand-green/30 text-brand-green"
                  : m === "losers" ? "bg-brand-red/20 border-brand-red/30 text-brand-red"
                  : "bg-brand-accent text-white border-brand-accent shadow-glow"
                : "bg-white/5 border-white/8 text-gray-400 hover:text-white"
            )}>
            {m === "all" ? (isRTL ? "הכל" : "All")
              : m === "gainers" ? `▲ ${t("topGainers")}`
              : `▼ ${t("topLosers")}`}
          </button>
        ))}
        <button onClick={fetchScreener}
          className="ms-auto w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-brand-card border border-brand-border rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="shimmer w-8 h-8 rounded-xl" />
                <div>
                  <div className="shimmer w-14 h-4 mb-1 rounded" />
                  <div className="shimmer w-10 h-3 rounded" />
                </div>
              </div>
              <div className="shimmer w-14 h-6 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((stock, i) => {
            const isUp = stock.changePercent >= 0;
            const isHot = Math.abs(stock.changePercent) > 3;
            return (
              <div key={stock.symbol}
                className={clsx(
                  "rounded-2xl px-4 py-3 flex items-center justify-between border transition-all",
                  isUp ? "bg-brand-card border-brand-green/10 hover:border-brand-green/25"
                    : "bg-brand-card border-brand-red/10 hover:border-brand-red/25"
                )}>
                <div className="flex items-center gap-3">
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    isUp ? "bg-brand-green/10" : "bg-brand-red/10")}>
                    {isHot
                      ? <Flame size={15} className={isUp ? "text-brand-green" : "text-brand-red"} />
                      : isUp
                      ? <TrendingUp size={15} className="text-brand-green" />
                      : <TrendingDown size={15} className="text-brand-red" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-bold text-sm">{stock.symbol}</p>
                      {i === 0 && (
                        <span className="text-xs bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded-lg font-medium">
                          {isRTL ? "מוביל" : "Top"}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">${stock.price?.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className={clsx("font-bold text-sm", isUp ? "text-brand-green" : "text-brand-red")}>
                    {isUp ? "+" : ""}{stock.changePercent?.toFixed(2)}%
                  </p>
                  <p className={clsx("text-xs opacity-70", isUp ? "text-brand-green" : "text-brand-red")}>
                    {isUp ? "+" : ""}${stock.change?.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t("noData")}</div>
          )}
        </div>
      )}
    </div>
  );
}
