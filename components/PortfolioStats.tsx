"use client";
import { useEffect, useState } from "react";
import { useApp, PortfolioItem } from "@/lib/context";
import { Shield, Calculator, TrendingUp, DollarSign } from "lucide-react";
import clsx from "clsx";

type Quote = { symbol: string; price: number; changePercent: number };
type StockInfo = { beta?: number; dividendYield?: number; dividendRate?: number };

type Props = {
  quotes: Record<string, Quote>;
  forex: number;
  totalPnL: number;
  totalCostUSD: number;
};

function effectivePrice(item: PortfolioItem, quotes: Record<string, Quote>): number {
  if (item.manualPrice && item.manualPrice > 0) return item.manualPrice;
  return quotes[item.symbol]?.price ?? 0;
}

function itemValueUSD(item: PortfolioItem, quotes: Record<string, Quote>, forex: number): number {
  const p = effectivePrice(item, quotes);
  const val = p * item.shares;
  return item.currency === "ILS" ? val / forex : val;
}

function riskLabel(beta: number, isRTL: boolean) {
  if (beta < 0.8) return { label: isRTL ? "סיכון נמוך" : "Low Risk", color: "text-brand-green", bg: "bg-brand-green/10" };
  if (beta < 1.2) return { label: isRTL ? "סיכון בינוני" : "Moderate Risk", color: "text-brand-yellow", bg: "bg-brand-yellow/10" };
  if (beta < 1.6) return { label: isRTL ? "סיכון גבוה" : "High Risk", color: "text-orange-400", bg: "bg-orange-400/10" };
  return { label: isRTL ? "סיכון גבוה מאוד" : "Very High Risk", color: "text-brand-red", bg: "bg-brand-red/10" };
}

export default function PortfolioStats({ quotes, forex, totalPnL, totalCostUSD }: Props) {
  const { portfolio, isRTL } = useApp();
  const [infos, setInfos] = useState<Record<string, StockInfo>>({});

  const usSymbols = portfolio.filter(p => p.currency !== "ILS" && !p.manualPrice).map(p => p.symbol);
  const totalValueUSD = portfolio.reduce((s, item) => s + itemValueUSD(item, quotes, forex), 0);

  useEffect(() => {
    if (!usSymbols.length) return;
    Promise.all(
      usSymbols.map(sym =>
        fetch(`/api/stock-info?symbol=${sym}`)
          .then(r => r.json())
          .then(d => ({ sym, data: d }))
          .catch(() => null)
      )
    ).then(results => {
      const map: Record<string, StockInfo> = {};
      results.forEach(r => { if (r) map[r.sym] = r.data; });
      setInfos(map);
    });
  }, [usSymbols.join(",")]); // eslint-disable-line

  // Weighted portfolio beta
  const betaItems = portfolio.filter(p => infos[p.symbol]?.beta != null && p.currency !== "ILS");
  const portfolioBeta = betaItems.length > 0
    ? betaItems.reduce((sum, item) => {
        const w = totalValueUSD > 0 ? itemValueUSD(item, quotes, forex) / totalValueUSD : 0;
        return sum + (infos[item.symbol]?.beta ?? 1) * w;
      }, 0)
    : null;

  // Tax estimate (Israel: 25% on capital gains)
  const taxEstimate = totalPnL > 0 ? totalPnL * 0.25 : 0;
  const netGain = totalPnL > 0 ? totalPnL * 0.75 : totalPnL;

  // Annual dividend income
  const annualDividend = portfolio.reduce((sum, item) => {
    const info = infos[item.symbol];
    if (!info?.dividendYield) return sum;
    const val = itemValueUSD(item, quotes, forex);
    return sum + val * info.dividendYield;
  }, 0);

  const risk = portfolioBeta != null ? riskLabel(portfolioBeta, isRTL) : null;

  if (!Object.keys(quotes).length) return null;

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
        {isRTL ? "נתוני תיק מתקדמים" : "Portfolio Analytics"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Risk Score */}
        {risk && (
          <div className={clsx("rounded-xl p-3", risk.bg)}>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield size={12} className={risk.color} />
              <span className="text-gray-500 text-[10px]">{isRTL ? "רמת סיכון" : "Risk Level"}</span>
            </div>
            <p className={clsx("text-sm font-bold", risk.color)}>{risk.label}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">
              Beta: {portfolioBeta!.toFixed(2)}
            </p>
          </div>
        )}

        {/* Tax estimate */}
        {totalPnL !== 0 && (
          <div className={clsx("rounded-xl p-3", totalPnL > 0 ? "bg-brand-yellow/8" : "bg-white/5")}>
            <div className="flex items-center gap-1.5 mb-1">
              <Calculator size={12} className={totalPnL > 0 ? "text-brand-yellow" : "text-gray-500"} />
              <span className="text-gray-500 text-[10px]">{isRTL ? "מס רווחי הון (25%)" : "Capital Gains Tax (25%)"}</span>
            </div>
            {totalPnL > 0 ? (
              <>
                <p className="text-brand-yellow text-sm font-bold">-${taxEstimate.toFixed(0)}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">
                  {isRTL ? "נטו:" : "Net:"} <span className="text-brand-green">${netGain.toFixed(0)}</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-brand-green text-sm font-bold">${Math.abs(totalPnL).toFixed(0)}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{isRTL ? "הפסד ניתן לקיזוז" : "Loss — tax offset"}</p>
              </>
            )}
          </div>
        )}

        {/* Dividend income */}
        {annualDividend > 0 && (
          <div className="rounded-xl p-3 bg-brand-green/8">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign size={12} className="text-brand-green" />
              <span className="text-gray-500 text-[10px]">{isRTL ? "דיבידנד שנתי" : "Annual Dividends"}</span>
            </div>
            <p className="text-brand-green text-sm font-bold">${annualDividend.toFixed(0)}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">
              ${(annualDividend / 12).toFixed(0)}{isRTL ? "/חודש" : "/mo"}
            </p>
          </div>
        )}

        {/* Portfolio return */}
        {totalCostUSD > 0 && (
          <div className="rounded-xl p-3 bg-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-brand-accent" />
              <span className="text-gray-500 text-[10px]">{isRTL ? "תשואה כוללת" : "Total Return"}</span>
            </div>
            <p className={clsx("text-sm font-bold", totalPnL >= 0 ? "text-brand-green" : "text-brand-red")}>
              {totalPnL >= 0 ? "+" : ""}{((totalPnL / totalCostUSD) * 100).toFixed(2)}%
            </p>
            <p className="text-gray-500 text-[10px] mt-0.5">
              {totalPnL >= 0 ? "+" : ""}${Math.abs(totalPnL).toFixed(0)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
