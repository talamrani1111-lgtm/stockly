"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useApp, PortfolioItem, PriceAlert } from "@/lib/context";
import { useCountUp } from "@/lib/useCountUp";
import { TrendingUp, TrendingDown, Plus, Trash2, Pencil, Check, ChevronUp, ChevronDown, LineChart, Share2 } from "lucide-react";
import clsx from "clsx";
import StockDetailSheet from "./StockDetailSheet";
import PortfolioSparkline, { savePortfolioValue } from "./PortfolioSparkline";
import ShareExport from "./ShareExport";
import PortfolioDonut from "./PortfolioDonut";
import PortfolioStats from "./PortfolioStats";
import MarketComparison from "./MarketComparison";
import DailyInsight from "./DailyInsight";
import BadgesPanel from "./BadgesPanel";
import AchievementToast from "./AchievementToast";
import Confetti from "./Confetti";
import PortfolioGoal from "./PortfolioGoal";
import PortfolioHeatMap from "./PortfolioHeatMap";
import RebalancingSuggestions from "./RebalancingSuggestions";
import MarketCountdown from "./MarketCountdown";
import { checkAndAward, updateStreak, addXP, getStreak, type Badge } from "@/lib/gamification";
import EarningsCountdown from "./EarningsCountdown";
import DividendTracker from "./DividendTracker";
import SectorPerformance from "./SectorPerformance";
import DCACalculator from "./DCACalculator";

type Quote = { symbol: string; price: number; change: number; changePercent: number };
type PriceTarget = { targetMean: number; targetHigh: number; targetLow: number; recommendation: string | null; numberOfAnalysts: number | null };

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 bg-brand-card border border-brand-border">
      <div className="shimmer h-4 w-16 mb-3" />
      <div className="shimmer h-7 w-24 mb-2" />
      <div className="shimmer h-3 w-12" />
    </div>
  );
}

type SearchResult = { symbol: string; name: string };

function SymbolSearch({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const { isRTL } = useApp();

  function handleInput(v: string) {
    onChange(v.toUpperCase());
    clearTimeout(debounce.current);
    if (v.length < 1) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${v}`);
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    }, 300);
  }

  return (
    <div className="relative">
      <input
        className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 transition-colors"
        placeholder={isRTL ? "סימול (לדוגמה AAPL)" : "Symbol (e.g. AAPL)"}
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="absolute top-full start-0 end-0 z-20 mt-1 bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-card">
          {results.map((r) => (
            <button key={r.symbol} onMouseDown={() => { onChange(r.symbol); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-start">
              <span className="text-white font-bold text-sm w-16 flex-shrink-0">{r.symbol}</span>
              <span className="text-gray-400 text-xs truncate">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getMarketStatus(): "open" | "premarket" | "afterhours" | "closed" {
  const now = new Date();
  const ny = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = ny.getDay();
  const mins = ny.getHours() * 60 + ny.getMinutes();
  if (day === 0 || day === 6) return "closed";
  if (mins >= 570 && mins < 960) return "open";
  if (mins >= 240 && mins < 570) return "premarket";
  if (mins >= 960 && mins < 1200) return "afterhours";
  return "closed";
}

export default function Portfolio() {
  const { t, isRTL, portfolio, setPortfolio, alerts, setAlerts } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editShares, setEditShares] = useState("");
  const [editAvg, setEditAvg] = useState("");
  const [editManual, setEditManual] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newAvg, setNewAvg] = useState("");
  const [newTotalInvested, setNewTotalInvested] = useState("");
  const [newCurrency, setNewCurrency] = useState<"USD" | "ILS">("USD");
  const [newManualPrice, setNewManualPrice] = useState("");
  const [forex, setForex] = useState<number>(3.65);
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<string, PriceTarget>>({});
  const [showShare, setShowShare] = useState(false);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const prevHighRef = useRef(0);
  const prevQuotesRef = useRef<Record<string, Quote>>({});
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const [valueFlash, setValueFlash] = useState<"up" | "down" | null>(null);
  const prevTotalRef = useRef(0);

  const symbols = portfolio.filter((p) => !p.manualPrice).map((p) => p.symbol);

  const fetchQuotes = useCallback(async () => {
    if (!symbols.length) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/stocks?symbols=${symbols.join(",")}`);
      const data: Quote[] = await res.json();
      const map: Record<string, Quote> = {};
      data.forEach((q) => (map[q.symbol] = q));

      // Detect price changes and schedule flash
      const flashes: Record<string, "up" | "down"> = {};
      data.forEach(q => {
        const prev = prevQuotesRef.current[q.symbol];
        if (prev && prev.price !== q.price) {
          flashes[q.symbol] = q.price > prev.price ? "up" : "down";
        }
      });
      if (Object.keys(flashes).length) {
        setFlashMap(flashes);
        setTimeout(() => setFlashMap({}), 900);
      }
      prevQuotesRef.current = map;

      setQuotes(map);
    } catch {}
    setLoading(false);
  }, [symbols.join(",")]); // eslint-disable-line

  useEffect(() => {
    fetchQuotes();
    fetch("/api/forex").then((r) => r.json()).then((d) => { if (d.rate) setForex(d.rate); }).catch(() => {});

    const status = getMarketStatus();
    const interval = status === "open" ? 10000 : status === "premarket" || status === "afterhours" ? 30000 : 120000;
    const id = setInterval(fetchQuotes, interval);
    return () => clearInterval(id);
  }, [fetchQuotes]);

  // Streak on first load
  useEffect(() => {
    const s = updateStreak();
    setStreak(s.current);
    addXP(5);
  }, []); // eslint-disable-line

  // Save portfolio value history + badges + confetti
  useEffect(() => {
    if (loading || !Object.keys(quotes).length) return;
    const total = portfolio.reduce((sum, item) => {
      const p = item.manualPrice ?? quotes[item.symbol]?.price ?? 0;
      const val = p * item.shares;
      return sum + (item.currency === "ILS" ? val / forex : val);
    }, 0);
    if (total <= 0) return;
    savePortfolioValue(total);

    // All-time high check
    const storedHigh = parseFloat(localStorage.getItem("portfolio_ath") ?? "0");
    const isATH = total > storedHigh && storedHigh > 0;
    if (total > storedHigh) localStorage.setItem("portfolio_ath", String(total));
    if (isATH && prevHighRef.current > 0 && total > prevHighRef.current * 1.001) {
      setShowConfetti(true);
    }
    prevHighRef.current = total;

    const cost = portfolio.reduce((sum, item) => {
      const c = item.avgPrice * item.shares;
      return sum + (item.currency === "ILS" ? c / forex : c);
    }, 0);
    const returnPct = cost > 0 ? ((total - cost) / cost) * 100 : 0;
    const lessonsCompleted = (() => {
      try { return JSON.parse(localStorage.getItem("learn_completed") ?? "[]").length; } catch { return 0; }
    })();

    const earned = checkAndAward({
      portfolioSize: portfolio.length,
      portfolioValue: total,
      portfolioReturn: returnPct,
      isAllTimeHigh: isATH,
      lessonsCompleted,
    });
    if (earned.length) {
      setNewBadges(earned);
      addXP(earned.length * 50);
    }
  }, [quotes, loading]); // eslint-disable-line

  // Check price alerts
  useEffect(() => {
    if (!Object.keys(quotes).length) return;
    const pending = alerts.filter(a => !a.triggered);
    if (!pending.length) return;

    const triggered: PriceAlert[] = [];
    pending.forEach(alert => {
      const q = quotes[alert.symbol];
      if (!q) return;
      const hit = alert.direction === "above"
        ? q.price >= alert.targetPrice
        : q.price <= alert.targetPrice;
      if (hit) triggered.push(alert);
    });

    if (triggered.length) {
      navigator.vibrate?.([100, 50, 100, 50, 100]);
      triggered.forEach(alert => {
        fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Stockly · ${alert.symbol}`,
            body: `${alert.symbol} ${alert.direction === "above" ? "עלה מעל" : "ירד מתחת"} $${alert.targetPrice}`,
          }),
        }).catch(() => {});
      });
      setAlerts(alerts.map(a =>
        triggered.find(t => t.id === a.id) ? { ...a, triggered: true } : a
      ));
    }
  }, [quotes]); // eslint-disable-line

  // Fetch analyst targets
  useEffect(() => {
    const usSymbols = portfolio.filter((p) => p.currency !== "ILS" && !p.manualPrice).map((p) => p.symbol);
    if (!usSymbols.length) return;
    Promise.all(
      usSymbols.map((sym) =>
        fetch(`/api/price-target?symbol=${sym}`)
          .then((r) => r.json())
          .then((d) => ({ sym, data: d }))
          .catch(() => null)
      )
    ).then((results) => {
      const map: Record<string, PriceTarget> = {};
      results.forEach((r) => { if (r && r.data?.targetMean > 0) map[r.sym] = r.data; });
      setTargets(map);
    });
  }, [portfolio.map((p) => p.symbol).join(",")]); // eslint-disable-line

  function effectivePrice(item: PortfolioItem): number | null {
    if (item.manualPrice != null && item.manualPrice > 0) return item.manualPrice;
    const q = quotes[item.symbol];
    return q?.price > 0 ? q.price : null;
  }

  function itemValueUSD(item: PortfolioItem): number {
    const p = effectivePrice(item);
    if (!p) return 0;
    const val = p * item.shares;
    return item.currency === "ILS" ? val / forex : val;
  }

  function itemCostUSD(item: PortfolioItem): number {
    const cost = item.avgPrice * item.shares;
    return item.currency === "ILS" ? cost / forex : cost;
  }

  const totalValueUSD = portfolio.reduce((sum, item) => sum + itemValueUSD(item), 0);
  const totalCostUSD = portfolio.reduce((sum, item) => sum + itemCostUSD(item), 0);
  const totalPnL = totalValueUSD - totalCostUSD;
  const totalPnLPct = totalCostUSD > 0 ? (totalPnL / totalCostUSD) * 100 : 0;
  const totalILS = totalValueUSD * forex;

  // Animated total value
  const animatedTotal = useCountUp(totalValueUSD, 700);

  // Flash total value on change
  useEffect(() => {
    if (loading || totalValueUSD === 0) return;
    if (prevTotalRef.current === 0) { prevTotalRef.current = totalValueUSD; return; }
    if (totalValueUSD !== prevTotalRef.current) {
      setValueFlash(totalValueUSD > prevTotalRef.current ? "up" : "down");
      setTimeout(() => setValueFlash(null), 750);
      prevTotalRef.current = totalValueUSD;
    }
  }, [totalValueUSD, loading]);

  function formatPrice(item: PortfolioItem, price: number): string {
    return item.currency === "ILS" ? `₪${price.toFixed(2)}` : `$${price.toFixed(2)}`;
  }

  function formatValue(item: PortfolioItem, price: number): string {
    const val = price * item.shares;
    return item.currency === "ILS"
      ? `₪${val.toLocaleString("he", { maximumFractionDigits: 0 })}`
      : `$${val.toLocaleString("en", { maximumFractionDigits: 0 })}`;
  }

  function haptic(pattern: number | number[] = 30) {
    navigator.vibrate?.(pattern);
  }

  function addPosition() {
    if (!newSymbol || !newShares) return;
    const sym = newSymbol.toUpperCase().trim();
    const shares = parseFloat(newShares);
    const total = parseFloat(newTotalInvested);
    const avgPrice = total > 0 && shares > 0
      ? total / shares
      : parseFloat(newAvg) || 0;
    const manualPrice = parseFloat(newManualPrice) || undefined;
    const existing = portfolio.find((p) => p.symbol === sym);
    if (existing) {
      setPortfolio(portfolio.map((p) => p.symbol === sym ? { ...p, shares: p.shares + shares } : p));
    } else {
      setPortfolio([...portfolio, { symbol: sym, shares, avgPrice, currency: newCurrency, manualPrice }]);
    }
    haptic([20, 10, 20]);
    setNewSymbol(""); setNewShares(""); setNewAvg(""); setNewTotalInvested(""); setNewCurrency("USD"); setNewManualPrice("");
  }

  function startEdit(item: PortfolioItem) {
    setEditingItem(item.symbol);
    setEditShares(String(item.shares));
    setEditAvg(String(item.avgPrice));
    setEditManual(item.manualPrice ? String(item.manualPrice) : "");
  }

  function saveEdit(symbol: string) {
    const shares = parseFloat(editShares) || portfolio.find(p => p.symbol === symbol)?.shares || 0;
    const total = parseFloat(editTotal);
    const avgPrice = total > 0 && shares > 0
      ? total / shares
      : parseFloat(editAvg) || portfolio.find(p => p.symbol === symbol)?.avgPrice || 0;
    setPortfolio(portfolio.map((p) => p.symbol === symbol ? {
      ...p,
      shares,
      avgPrice,
      manualPrice: parseFloat(editManual) || undefined,
    } : p));
    haptic(20);
    setEditTotal("");
    setEditingItem(null);
  }

  function addAlert(symbol: string, price: number, direction: "above" | "below") {
    const newAlert: PriceAlert = {
      id: `${symbol}_${Date.now()}`,
      symbol, targetPrice: price, direction,
      triggered: false, createdAt: Date.now(),
    };
    setAlerts([...alerts.filter(a => !(a.symbol === symbol && a.direction === direction)), newAlert]);
  }

  const detailItem = portfolio.find(p => p.symbol === detailSymbol);
  const detailQuote = detailSymbol ? (quotes[detailSymbol] ?? null) : null;

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* Confetti on ATH */}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* Achievement toast */}
      {newBadges.length > 0 && (
        <AchievementToast badges={newBadges} onDone={() => setNewBadges([])} />
      )}

      {/* Share/Export sheet */}
      {showShare && (
        <ShareExport
          quotes={quotes}
          forex={forex}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Detail sheet */}
      {detailSymbol && (
        <StockDetailSheet
          symbol={detailSymbol}
          quote={detailQuote}
          portfolioItem={detailItem}
          forex={forex}
          onClose={() => setDetailSymbol(null)}
          onSetAlert={addAlert}
        />
      )}

      {/* Total value */}
      <div className="rounded-3xl p-5 mb-4 bg-blue-gradient border border-brand-accent/20 shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-1">
          <p className="text-gray-400 text-xs font-medium">{t("totalValue")}</p>
          <button onClick={() => setShowShare(true)}
            className="flex items-center gap-1 text-gray-500 hover:text-brand-accent transition-colors text-xs py-0.5 px-2 rounded-lg hover:bg-brand-accent/10">
            <Share2 size={11} />
            <span>{isRTL ? "שתף" : "Share"}</span>
          </button>
        </div>
        <div className="flex items-end gap-3 flex-wrap mb-2">
          <span className={`text-white text-3xl font-bold tracking-tight transition-all ${valueFlash === "up" ? "value-flash-up" : valueFlash === "down" ? "value-flash-down" : ""}`}>
            {loading ? <span className="shimmer inline-block w-28 h-8 rounded-lg" /> : `$${Math.round(animatedTotal).toLocaleString("en")}`}
          </span>
          {!loading && <span className="text-gray-400 text-base mb-1">≈ ₪{Math.round(animatedTotal * forex).toLocaleString("he")}</span>}
        </div>
        {totalCostUSD > 0 && !loading && (
          <div className={clsx("flex items-center gap-1.5 text-sm font-semibold", totalPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
            {totalPnL >= 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{totalPnL >= 0 ? "+" : ""}${Math.abs(totalPnL).toFixed(0)}</span>
            <span className="text-xs opacity-75">({totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(1)}%)</span>
          </div>
        )}
        {!loading && <PortfolioSparkline currentValue={totalValueUSD} isHe={isRTL} />}

        {/* Daily change + since-start stats */}
        {!loading && Object.keys(quotes).length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/8">
            {(() => {
              const dailyChangeUSD = portfolio.reduce((sum, item) => {
                if (item.currency === "ILS" || item.manualPrice) return sum;
                const q = quotes[item.symbol];
                if (!q) return sum;
                return sum + q.change * item.shares;
              }, 0);
              const dailyPct = totalValueUSD > 0 ? (dailyChangeUSD / (totalValueUSD - dailyChangeUSD)) * 100 : 0;
              const dayUp = dailyChangeUSD >= 0;
              return (
                <>
                  <div>
                    <p className="text-gray-500 text-[10px] font-medium mb-0.5">{t("dailyChange")}</p>
                    <p className={clsx("text-sm font-bold", dayUp ? "text-brand-green" : "text-brand-red")}>
                      {dayUp ? "+" : ""}${Math.abs(dailyChangeUSD).toFixed(0)}
                    </p>
                    <p className={clsx("text-[10px] font-semibold opacity-80", dayUp ? "text-brand-green" : "text-brand-red")}>
                      {dayUp ? "+" : ""}{dailyPct.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] font-medium mb-0.5">{t("sinceStart")}</p>
                    <p className={clsx("text-sm font-bold", totalPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
                      {totalPnL >= 0 ? "+" : ""}${Math.abs(totalPnL).toFixed(0)}
                    </p>
                    <p className={clsx("text-[10px] font-semibold opacity-80", totalPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
                      {totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(2)}%
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Allocation donut */}
      {!loading && portfolio.length > 1 && (
        <PortfolioDonut quotes={quotes} forex={forex} />
      )}

      {/* Market countdown */}
      {!loading && <MarketCountdown />}

      {/* Heat map */}
      {!loading && portfolio.length > 1 && Object.keys(quotes).length > 0 && (
        <PortfolioHeatMap quotes={quotes} forex={forex} />
      )}

      {/* Rebalancing */}
      {!loading && portfolio.length > 1 && Object.keys(quotes).length > 0 && (
        <RebalancingSuggestions quotes={quotes} forex={forex} />
      )}

      {/* Portfolio analytics */}
      {!loading && portfolio.length > 0 && (
        <PortfolioStats
          quotes={quotes}
          forex={forex}
          totalPnL={totalPnL}
          totalCostUSD={totalCostUSD}
        />
      )}

      {/* Daily insight card */}
      {!loading && portfolio.length > 0 && Object.keys(quotes).length > 0 && (
        <DailyInsight
          quotes={quotes}
          forex={forex}
          totalValueUSD={totalValueUSD}
          totalPnL={totalPnL}
          totalCostUSD={totalCostUSD}
          streak={streak}
        />
      )}

      {/* Portfolio goal */}
      {!loading && <PortfolioGoal currentValue={totalValueUSD} />}

      {/* Badges & XP */}
      {!loading && <BadgesPanel />}

      {/* Sector performance */}
      {!loading && <SectorPerformance />}

      {/* Earnings countdown */}
      {!loading && portfolio.length > 0 && (
        <EarningsCountdown symbols={portfolio.filter(p => !p.manualPrice && p.currency === "USD").map(p => p.symbol)} />
      )}

      {/* Dividend tracker */}
      {!loading && portfolio.length > 0 && (
        <DividendTracker portfolio={portfolio} />
      )}

      {/* DCA Calculator */}
      {!loading && <DCACalculator />}

      {/* Portfolio vs Market comparison */}
      {!loading && portfolio.length > 0 && (
        <div className="mb-4">
          <MarketComparison />
        </div>
      )}

      {/* Empty state */}
      {!loading && portfolio.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-4">
            <TrendingUp size={28} className="text-brand-accent" />
          </div>
          <p className="text-white font-semibold text-base mb-1">{isRTL ? "התיק שלך ריק" : "Your portfolio is empty"}</p>
          <p className="text-gray-500 text-sm mb-4">{isRTL ? "לחץ על עריכה כדי להוסיף מניות" : "Tap Edit to add your first stock"}</p>
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-brand-accent hover:bg-blue-500 text-white rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all shadow-glow press-effect">
            <Plus size={15} />
            {isRTL ? "הוסף מניה" : "Add Stock"}
          </button>
        </div>
      )}

      {/* Stock cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : portfolio.map((item) => {
              const q = quotes[item.symbol];
              const price = effectivePrice(item);
              const isManual = item.manualPrice != null && item.manualPrice > 0;
              const isUp = isManual ? (price ?? 0) >= item.avgPrice : (q?.changePercent ?? 0) >= 0;
              const pnlAmt = price && item.avgPrice > 0 ? (price - item.avgPrice) * item.shares : null;
              const pnlPct = price && item.avgPrice > 0 ? ((price - item.avgPrice) / item.avgPrice) * 100 : null;
              const isEditingThis = editingItem === item.symbol;
              const activeAlerts = alerts.filter(a => a.symbol === item.symbol && !a.triggered);

              const flash = flashMap[item.symbol];
              return (
                <div key={item.symbol}
                  className={clsx("rounded-2xl p-4 relative border transition-all cursor-pointer glow-hover card-enter",
                    isUp ? "bg-green-gradient border-brand-green/20" : "bg-red-gradient border-brand-red/20")}
                  style={{ animationDelay: `${portfolio.indexOf(item) * 55}ms` }}
                  onClick={() => !editing && !isEditingThis && setDetailSymbol(item.symbol)}>

                  {/* Active alert indicator */}
                  {activeAlerts.length > 0 && !editing && (
                    <div className="absolute top-2 start-2 w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                  )}

                  {/* Action buttons */}
                  <div className="absolute top-2.5 end-2.5 flex gap-1">
                    {editing && !isEditingThis && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                          className="w-6 h-6 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent hover:bg-brand-accent/30 transition-colors">
                          <Pencil size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setPortfolio(portfolio.filter((p) => p.symbol !== item.symbol)); }}
                          className="w-6 h-6 rounded-lg bg-brand-red/20 flex items-center justify-center text-brand-red hover:bg-brand-red/30 transition-colors">
                          <Trash2 size={10} />
                        </button>
                      </>
                    )}
                    {isEditingThis && (
                      <button onClick={(e) => { e.stopPropagation(); saveEdit(item.symbol); }}
                        className="w-6 h-6 rounded-lg bg-brand-green/20 flex items-center justify-center text-brand-green">
                        <Check size={10} />
                      </button>
                    )}
                  </div>

                  {/* Edit mode */}
                  {isEditingThis ? (
                    <div className="flex flex-col gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
                      <p className="text-white font-bold text-sm mb-1">{item.symbol}</p>
                      <input className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-brand-accent/50"
                        placeholder={t("shares")} value={editShares} onChange={(e) => setEditShares(e.target.value)} type="number" />
                      <p className="text-gray-500 text-[10px] text-center">{isRTL ? "— מחיר קנייה —" : "— purchase price —"}</p>
                      <input className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-brand-accent/50"
                        placeholder={isRTL ? "סה״כ ששילמת (למשל 6128)" : "Total paid (e.g. 6128)"}
                        value={editTotal} onChange={(e) => { setEditTotal(e.target.value); setEditAvg(""); }} type="number" />
                      <input className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-brand-accent/50"
                        placeholder={isRTL ? "או מחיר ממוצע למניה" : "Or avg price per share"}
                        value={editAvg} onChange={(e) => { setEditAvg(e.target.value); setEditTotal(""); }} type="number" />
                      {item.manualPrice != null && (
                        <input className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-brand-accent/50"
                          placeholder={isRTL ? "מחיר נוכחי" : "Current price"} value={editManual} onChange={(e) => setEditManual(e.target.value)} type="number" />
                      )}
                      {editTotal && editShares && parseFloat(editShares) > 0 && (
                        <p className="text-brand-green text-[10px] text-center">
                          {isRTL ? "מחיר ממוצע:" : "Avg price:"} {(parseFloat(editTotal) / parseFloat(editShares)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-white font-bold text-sm">{item.symbol}</span>
                          {item.currency === "ILS" && <span className="text-gray-500 text-xs ms-1">₪</span>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setDetailSymbol(item.symbol); }}
                          className={clsx("w-7 h-7 rounded-xl flex items-center justify-center transition-colors",
                            isUp ? "bg-brand-green/20 hover:bg-brand-green/30" : "bg-brand-red/20 hover:bg-brand-red/30")}>
                          <LineChart size={13} className={isUp ? "text-brand-green" : "text-brand-red"} />
                        </button>
                      </div>
                      <p className={clsx("text-white text-xl font-bold tracking-tight mb-0.5",
                        flash === "up" ? "flash-green" : flash === "down" ? "flash-red" : "")}>
                        {price ? formatPrice(item, price) : "—"}
                        {isManual && <span className="text-gray-500 text-xs ms-1">✎</span>}
                      </p>
                      <p className={clsx("text-xs font-semibold mb-2", isUp ? "text-brand-green" : "text-brand-red")}>
                        {!isManual && q ? `${isUp ? "▲" : "▼"} ${Math.abs(q.changePercent).toFixed(2)}%` : ""}
                      </p>
                      <div className="border-t border-white/5 pt-2 space-y-0.5">
                        <p className="text-gray-400 text-xs">{item.shares} {t("shares_unit")}</p>
                        <p className="text-gray-300 text-xs font-medium">{price ? formatValue(item, price) : "—"}</p>
                        {pnlAmt !== null && pnlPct !== null && (
                          <p className={clsx("text-xs font-semibold", pnlAmt >= 0 ? "text-brand-green" : "text-brand-red")}>
                            {pnlAmt >= 0 ? "+" : ""}{item.currency === "ILS" ? "₪" : "$"}{Math.abs(pnlAmt).toFixed(0)}
                            {" "}({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                          </p>
                        )}
                        {targets[item.symbol] && price && (
                          <p className={clsx(
                            "text-[10px] font-semibold mt-0.5 flex items-center gap-0.5",
                            targets[item.symbol].targetMean > price ? "text-brand-green/80" : "text-brand-red/80"
                          )}>
                            <span className="text-gray-500">{isRTL ? "יעד:" : "Target:"}</span>
                            {" "}${targets[item.symbol].targetMean.toFixed(0)}
                            <span className="text-gray-600 text-[9px]">
                              {" "}({targets[item.symbol].targetMean > price ? "▲" : "▼"}
                              {Math.abs(((targets[item.symbol].targetMean - price) / price) * 100).toFixed(0)}%)
                            </span>
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
      </div>

      {/* Active alerts summary */}
      {alerts.filter(a => !a.triggered).length > 0 && (
        <div className="bg-brand-card border border-brand-accent/20 rounded-2xl p-3 mb-3">
          <p className="text-gray-400 text-xs font-medium mb-2">
            {isRTL ? "התראות פעילות" : "Active Alerts"}
          </p>
          <div className="flex flex-col gap-1.5">
            {alerts.filter(a => !a.triggered).map(alert => (
              <div key={alert.id} className="flex items-center justify-between">
                <span className="text-white text-xs">
                  <span className="font-bold">{alert.symbol}</span>
                  {" "}{alert.direction === "above" ? "▲" : "▼"} ${alert.targetPrice}
                </span>
                <button
                  onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                  className="text-gray-600 hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit toggle */}
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditing(!editing); setEditingItem(null); }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-1 px-3 rounded-xl bg-white/5 border border-white/8">
          {editing ? <><Check size={12} /> {t("done")}</> : <><Pencil size={12} /> {t("editPortfolio")}</>}
        </button>
      </div>

      {/* Add position form */}
      {editing && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-3">{t("addPosition")}</p>
          <div className="flex flex-col gap-2">
            <SymbolSearch value={newSymbol} onChange={setNewSymbol} />

            {/* Shares */}
            <input className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
              placeholder={isRTL ? "מספר יחידות / מניות" : "Number of shares"} type="number" value={newShares}
              onChange={(e) => {
                setNewShares(e.target.value);
                const total = parseFloat(newTotalInvested);
                const sh = parseFloat(e.target.value);
                if (total > 0 && sh > 0) setNewAvg((total / sh).toFixed(4));
              }} />

            {/* Total OR avg price */}
            <div className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5">
              <p className="text-gray-500 text-[10px] mb-1.5">{isRTL ? "כמה שילמת? (בחר אחד)" : "What did you pay? (pick one)"}</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-gray-600 text-[9px] mb-1">{isRTL ? "סה\"כ השקעה" : "Total invested"}</p>
                  <input className="w-full bg-brand-bg border border-brand-border rounded-lg px-2.5 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
                    placeholder={newCurrency === "ILS" ? "₪ 6,128" : "$ 3,000"} type="number" value={newTotalInvested}
                    onChange={(e) => {
                      setNewTotalInvested(e.target.value);
                      const total = parseFloat(e.target.value);
                      const sh = parseFloat(newShares);
                      if (total > 0 && sh > 0) setNewAvg((total / sh).toFixed(4));
                    }} />
                </div>
                <div className="flex items-center text-gray-600 text-xs font-bold flex-shrink-0 mt-4">או</div>
                <div className="flex-1">
                  <p className="text-gray-600 text-[9px] mb-1">{isRTL ? "מחיר ליחידה" : "Price per share"}</p>
                  <input className="w-full bg-brand-bg border border-brand-border rounded-lg px-2.5 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
                    placeholder={newCurrency === "ILS" ? "₪ 15.47" : "$ 600"} type="number" value={newAvg}
                    onChange={(e) => { setNewAvg(e.target.value); setNewTotalInvested(""); }} />
                </div>
              </div>
              {newTotalInvested && newShares && parseFloat(newShares) > 0 && (
                <p className="text-brand-accent text-[10px] mt-1.5">
                  → {isRTL ? "מחיר ליחידה" : "Per share"}: {newCurrency === "ILS" ? "₪" : "$"}{(parseFloat(newTotalInvested) / parseFloat(newShares)).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {(["USD", "ILS"] as const).map((c) => (
                <button key={c} onClick={() => setNewCurrency(c)}
                  className={clsx("flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                    newCurrency === c ? "bg-brand-accent border-brand-accent text-white" : "bg-brand-surface border-brand-border text-gray-400")}>
                  {c === "USD" ? "$ USD" : "₪ ILS"}
                </button>
              ))}
            </div>
            <input className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
              placeholder={isRTL ? "מחיר נוכחי ידני (לקרנות כמו ת\"א 125)" : "Manual current price (for funds)"}
              type="number" value={newManualPrice} onChange={(e) => setNewManualPrice(e.target.value)} />
            <button onClick={addPosition}
              className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors shadow-glow">
              <Plus size={15} /> {t("addStock")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
