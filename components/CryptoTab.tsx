"use client";
import { useEffect, useState, useCallback } from "react";
import { useApp, CryptoItem } from "@/lib/context";
import { Plus, Trash2, Pencil, Check, ChevronUp, ChevronDown, Bitcoin } from "lucide-react";
import clsx from "clsx";
import { COIN_IDS } from "@/lib/coinIds";

type CryptoQuote = { symbol: string; price: number; changePercent: number; marketCap?: number };

const POPULAR_COINS: { symbol: string; name: string }[] = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "DOT", name: "Polkadot" },
];

const COIN_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", BNB: "#f3ba2f",
  XRP: "#00aae4", ADA: "#0d1e2d", AVAX: "#e84142", DOGE: "#c3a634",
  LINK: "#2a5ada", DOT: "#e6007a", MATIC: "#8247e5", LTC: "#bebebe",
};

function coinColor(sym: string) { return COIN_COLORS[sym] ?? "#3b82f6"; }

function CoinIcon({ symbol, size = 32 }: { symbol: string; size?: number }) {
  return (
    <div className="rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white"
      style={{ width: size, height: size, backgroundColor: coinColor(symbol) + "33", fontSize: size * 0.35 }}>
      <span style={{ color: coinColor(symbol) }}>{symbol.slice(0, 3)}</span>
    </div>
  );
}

function formatLargeNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function CryptoTab() {
  const { isRTL, cryptoPortfolio, setCryptoPortfolio } = useApp();
  const [quotes, setQuotes] = useState<Record<string, CryptoQuote>>({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editAvg, setEditAvg] = useState("");

  // Add form
  const [newSymbol, setNewSymbol] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newAvg, setNewAvg] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const symbols = cryptoPortfolio.map(c => c.symbol);

  const fetchQuotes = useCallback(async () => {
    const allSymbols = [...new Set([...symbols, ...POPULAR_COINS.map(c => c.symbol)])];
    if (!allSymbols.length) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crypto?symbols=${allSymbols.join(",")}`);
      const data: CryptoQuote[] = await res.json();
      const map: Record<string, CryptoQuote> = {};
      data.forEach(q => { map[q.symbol] = q; });
      setQuotes(map);
    } catch {}
    setLoading(false);
  }, [symbols.join(",")]); // eslint-disable-line

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => {
    const id = setInterval(fetchQuotes, 60000);
    return () => clearInterval(id);
  }, [fetchQuotes]);

  const totalUSD = cryptoPortfolio.reduce((sum, item) => {
    const q = quotes[item.symbol];
    return sum + (q?.price ?? 0) * item.amount;
  }, 0);

  const totalCost = cryptoPortfolio.reduce((sum, item) => sum + item.avgPrice * item.amount, 0);
  const totalPnL = totalUSD - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const isUp = totalPnL >= 0;

  function addCoin() {
    if (!newSymbol || !newAmount) return;
    const sym = newSymbol.toUpperCase().trim();
    const existing = cryptoPortfolio.find(c => c.symbol === sym);
    const id = COIN_IDS[sym] ?? sym.toLowerCase();
    if (existing) {
      setCryptoPortfolio(cryptoPortfolio.map(c => c.symbol === sym
        ? { ...c, amount: c.amount + parseFloat(newAmount) }
        : c
      ));
    } else {
      setCryptoPortfolio([...cryptoPortfolio, {
        id, symbol: sym,
        amount: parseFloat(newAmount),
        avgPrice: parseFloat(newAvg) || 0,
      }]);
    }
    navigator.vibrate?.([20, 10, 20]);
    setNewSymbol(""); setNewAmount(""); setNewAvg(""); setShowAdd(false);
  }

  function saveEdit(symbol: string) {
    setCryptoPortfolio(cryptoPortfolio.map(c => c.symbol === symbol ? {
      ...c,
      amount: parseFloat(editAmount) || c.amount,
      avgPrice: parseFloat(editAvg) || c.avgPrice,
    } : c));
    setEditingItem(null);
    navigator.vibrate?.(20);
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* Total value card */}
      {cryptoPortfolio.length > 0 && (
        <div className="rounded-3xl p-5 mb-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border border-orange-500/20 relative overflow-hidden">
          <div className="absolute top-3 end-4 opacity-10">
            <Bitcoin size={64} className="text-orange-400" />
          </div>
          <p className="text-gray-400 text-xs mb-1 font-medium">
            {isRTL ? "שווי קריפטו כולל" : "Total Crypto Value"}
          </p>
          <p className="text-white text-3xl font-bold tracking-tight mb-1">
            ${totalUSD.toLocaleString("en", { maximumFractionDigits: 0 })}
          </p>
          {totalCost > 0 && (
            <div className={clsx("flex items-center gap-1.5 text-sm font-semibold", isUp ? "text-brand-green" : "text-brand-red")}>
              {isUp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span>{isUp ? "+" : ""}${Math.abs(totalPnL).toFixed(0)}</span>
              <span className="text-xs opacity-75">({totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(1)}%)</span>
            </div>
          )}
        </div>
      )}

      {/* Holdings */}
      {cryptoPortfolio.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              {isRTL ? "אחזקות" : "Holdings"}
            </p>
            <button onClick={() => { setEditing(!editing); setEditingItem(null); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-1 px-3 rounded-xl bg-white/5 border border-white/8">
              {editing ? <><Check size={12} /> {isRTL ? "סיים" : "Done"}</> : <><Pencil size={12} /> {isRTL ? "ערוך" : "Edit"}</>}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {cryptoPortfolio.map(item => {
              const q = quotes[item.symbol];
              const val = (q?.price ?? 0) * item.amount;
              const cost = item.avgPrice * item.amount;
              const pnl = val - cost;
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
              const up = pnl >= 0;
              const isEditingThis = editingItem === item.symbol;

              return (
                <div key={item.symbol}
                  className="bg-brand-card border border-brand-border rounded-2xl px-4 py-3 flex items-center gap-3">
                  <CoinIcon symbol={item.symbol} size={36} />

                  {isEditingThis ? (
                    <div className="flex-1 flex gap-2" onClick={e => e.stopPropagation()}>
                      <input className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-brand-accent/50"
                        placeholder={isRTL ? "כמות" : "Amount"} value={editAmount}
                        onChange={e => setEditAmount(e.target.value)} type="number" />
                      <input className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-brand-accent/50"
                        placeholder={isRTL ? "מחיר קנייה" : "Buy price"} value={editAvg}
                        onChange={e => setEditAvg(e.target.value)} type="number" />
                      <button onClick={() => saveEdit(item.symbol)}
                        className="w-8 h-8 rounded-xl bg-brand-green/20 flex items-center justify-center text-brand-green flex-shrink-0">
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-white font-bold text-sm">{item.symbol}</span>
                          <span className="text-gray-500 text-xs">{item.amount}</span>
                        </div>
                        <p className="text-gray-400 text-xs">
                          {q ? `$${q.price.toLocaleString("en", { maximumFractionDigits: q.price > 1 ? 2 : 6 })}` : "—"}
                          {q && (
                            <span className={clsx("ms-1.5 font-semibold", q.changePercent >= 0 ? "text-brand-green" : "text-brand-red")}>
                              {q.changePercent >= 0 ? "▲" : "▼"} {Math.abs(q.changePercent).toFixed(2)}%
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <p className="text-white font-bold text-sm">${val.toLocaleString("en", { maximumFractionDigits: 0 })}</p>
                        {cost > 0 && (
                          <p className={clsx("text-xs font-semibold", up ? "text-brand-green" : "text-brand-red")}>
                            {up ? "+" : ""}{pnlPct.toFixed(1)}%
                          </p>
                        )}
                      </div>
                      {editing && (
                        <div className="flex gap-1 ms-1 flex-shrink-0">
                          <button onClick={() => { setEditingItem(item.symbol); setEditAmount(String(item.amount)); setEditAvg(String(item.avgPrice)); }}
                            className="w-7 h-7 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                            <Pencil size={11} />
                          </button>
                          <button onClick={() => setCryptoPortfolio(cryptoPortfolio.filter(c => c.symbol !== item.symbol))}
                            className="w-7 h-7 rounded-lg bg-brand-red/20 flex items-center justify-center text-brand-red">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add coin */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-white/15 hover:border-orange-400/40 text-gray-500 hover:text-orange-400 rounded-2xl py-3.5 text-sm transition-all mb-6">
          <Plus size={15} />
          {isRTL ? "הוסף מטבע קריפטו" : "Add Crypto"}
        </button>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-6">
          <p className="text-white text-sm font-semibold mb-3">{isRTL ? "הוסף מטבע" : "Add Coin"}</p>
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex gap-2 flex-wrap">
              {POPULAR_COINS.slice(0, 6).map(c => (
                <button key={c.symbol} onClick={() => setNewSymbol(c.symbol)}
                  className={clsx("px-2.5 py-1 rounded-xl text-xs font-bold transition-all border",
                    newSymbol === c.symbol
                      ? "text-white border-transparent"
                      : "bg-white/5 text-gray-400 border-white/8 hover:text-white"
                  )}
                  style={newSymbol === c.symbol ? { backgroundColor: coinColor(c.symbol) + "33", borderColor: coinColor(c.symbol) + "66", color: coinColor(c.symbol) } : {}}>
                  {c.symbol}
                </button>
              ))}
            </div>
            <input className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
              placeholder={isRTL ? "סימול (BTC, ETH...)" : "Symbol (BTC, ETH...)"}
              value={newSymbol} onChange={e => setNewSymbol(e.target.value.toUpperCase())} />
            <div className="flex gap-2">
              <input className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
                placeholder={isRTL ? "כמות" : "Amount"} type="number"
                value={newAmount} onChange={e => setNewAmount(e.target.value)} />
              <input className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
                placeholder={isRTL ? "מחיר קנייה $" : "Buy price $"} type="number"
                value={newAvg} onChange={e => setNewAvg(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 border border-white/8 hover:text-white transition-colors">
              {isRTL ? "ביטול" : "Cancel"}
            </button>
            <button onClick={addCoin} disabled={!newSymbol || !newAmount}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
              <Plus size={14} /> {isRTL ? "הוסף" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Market overview */}
      <div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
          {isRTL ? "שוק הקריפטו" : "Crypto Market"}
        </p>
        {loading && Object.keys(quotes).length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-brand-card border border-brand-border rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="shimmer w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="flex-1"><div className="shimmer h-4 w-12 mb-1.5" /><div className="shimmer h-3 w-20" /></div>
                <div className="shimmer h-5 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {POPULAR_COINS.map(({ symbol, name }) => {
              const q = quotes[symbol];
              if (!q || q.price === 0) return null;
              const up = q.changePercent >= 0;
              const owned = cryptoPortfolio.find(c => c.symbol === symbol);
              return (
                <div key={symbol}
                  className="bg-brand-card border border-brand-border rounded-2xl px-4 py-3 flex items-center gap-3">
                  <CoinIcon symbol={symbol} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{symbol}</span>
                      {owned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-lg font-semibold"
                          style={{ backgroundColor: coinColor(symbol) + "22", color: coinColor(symbol) }}>
                          {isRTL ? "בתיק" : "Owned"}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{name}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-white font-bold text-sm">
                      ${q.price.toLocaleString("en", { maximumFractionDigits: q.price > 1 ? 2 : 6 })}
                    </p>
                    <p className={clsx("text-xs font-semibold", up ? "text-brand-green" : "text-brand-red")}>
                      {up ? "▲" : "▼"} {Math.abs(q.changePercent).toFixed(2)}%
                    </p>
                  </div>
                  {q.marketCap && q.marketCap > 0 && (
                    <div className="text-gray-600 text-[10px] w-12 text-end flex-shrink-0">
                      {formatLargeNum(q.marketCap)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
