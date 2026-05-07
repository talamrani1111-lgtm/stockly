"use client";
import { useEffect, useState } from "react";
import { useApp, PortfolioItem } from "@/lib/context";
import { DollarSign, CalendarCheck } from "lucide-react";
import clsx from "clsx";

type DivData = {
  symbol: string;
  annualDividend: number | null;
  dividendYield: number | null;
  exDividendDate: number | null;
  payoutRatio: number | null;
  trailingAnnualDividendRate: number | null;
};

type Props = { portfolio: PortfolioItem[] };

export default function DividendTracker({ portfolio }: Props) {
  const { lang, isRTL } = useApp();
  const [data, setData] = useState<DivData[]>([]);
  const [loading, setLoading] = useState(true);

  const symbols = portfolio.filter(p => !p.manualPrice && p.currency === "USD").map(p => p.symbol);

  useEffect(() => {
    if (!symbols.length) { setLoading(false); return; }
    fetch(`/api/dividends?symbols=${symbols.join(",")}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbols.join(",")]); // eslint-disable-line

  if (loading || !data.length) return null;

  const annualIncome = data.reduce((sum, div) => {
    const item = portfolio.find(p => p.symbol === div.symbol);
    if (!item || !div.annualDividend) return sum;
    return sum + div.annualDividend * item.shares;
  }, 0);

  function formatDate(ts: number | null) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
      day: "numeric", month: "short", year: "numeric"
    });
  }

  function daysUntilEx(ts: number | null) {
    if (!ts) return null;
    const diff = ts - Date.now();
    if (diff < 0) return null;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-brand-green" />
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            {lang === "he" ? "דיבידנדים" : "Dividends"}
          </p>
        </div>
        {annualIncome > 0 && (
          <div className="text-end">
            <p className="text-brand-green text-sm font-bold">${annualIncome.toFixed(0)}</p>
            <p className="text-gray-600 text-[9px]">{lang === "he" ? "הכנסה שנתית" : "annual income"}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {data.map(div => {
          const item = portfolio.find(p => p.symbol === div.symbol);
          const myAnnual = item && div.annualDividend ? div.annualDividend * item.shares : null;
          const myQuarterly = myAnnual ? myAnnual / 4 : null;
          const exDays = daysUntilEx(div.exDividendDate);
          return (
            <div key={div.symbol} className="bg-brand-green/5 border border-brand-green/15 rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <DollarSign size={12} className="text-brand-green" />
                  <span className="text-white font-bold text-sm">{div.symbol}</span>
                  {div.dividendYield != null && (
                    <span className="text-brand-green text-[10px] font-semibold bg-brand-green/15 rounded px-1">
                      {(div.dividendYield * 100).toFixed(2)}%
                    </span>
                  )}
                </div>
                {myAnnual != null && (
                  <p className="text-brand-green text-xs font-bold">+${myAnnual.toFixed(0)}/yr</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1">
                <div>
                  <p className="text-gray-600 text-[9px]">{lang === "he" ? "לרבעון" : "Per quarter"}</p>
                  <p className="text-gray-300 text-[11px] font-semibold">
                    {myQuarterly != null ? `$${myQuarterly.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-[9px]">{lang === "he" ? "למניה/שנה" : "Annual/share"}</p>
                  <p className="text-gray-300 text-[11px] font-semibold">
                    {div.annualDividend != null ? `$${div.annualDividend.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-[9px] flex items-center gap-0.5">
                    <CalendarCheck size={8} />{lang === "he" ? "תשלום הבא" : "Ex-div"}
                  </p>
                  <p className={clsx("text-[11px] font-semibold",
                    exDays != null && exDays <= 14 ? "text-brand-yellow" : "text-gray-300")}>
                    {exDays != null ? (lang === "he" ? `${exDays}י׳` : `${exDays}d`) : formatDate(div.exDividendDate)}
                  </p>
                </div>
              </div>
              {div.payoutRatio != null && (
                <div className="mt-1.5">
                  <div className="flex justify-between text-[9px] text-gray-600 mb-0.5">
                    <span>{lang === "he" ? "יחס חלוקה" : "Payout ratio"}</span>
                    <span>{(div.payoutRatio * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/8">
                    <div
                      className={clsx("h-1 rounded-full transition-all",
                        div.payoutRatio > 0.8 ? "bg-brand-red" : div.payoutRatio > 0.6 ? "bg-brand-yellow" : "bg-brand-green")}
                      style={{ width: `${Math.min(div.payoutRatio * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {annualIncome > 0 && (
        <p className="text-gray-600 text-[9px] text-center mt-3">
          {lang === "he"
            ? `≈ $${(annualIncome / 12).toFixed(0)} לחודש · $${(annualIncome / 52).toFixed(0)} לשבוע`
            : `≈ $${(annualIncome / 12).toFixed(0)}/mo · $${(annualIncome / 52).toFixed(0)}/wk`}
        </p>
      )}
    </div>
  );
}
