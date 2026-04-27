"use client";
import { useState, useRef } from "react";
import { Share2, Download, X, FileText } from "lucide-react";
import { useApp, PortfolioItem } from "@/lib/context";
import clsx from "clsx";
import jsPDF from "jspdf";

type Quote = { symbol: string; price: number; changePercent: number };
type Props = {
  quotes: Record<string, Quote>;
  forex: number;
  onClose: () => void;
};

function effectivePrice(item: PortfolioItem, quotes: Record<string, Quote>): number {
  if (item.manualPrice && item.manualPrice > 0) return item.manualPrice;
  return quotes[item.symbol]?.price ?? 0;
}

export default function ShareExport({ quotes, forex, onClose }: Props) {
  const { portfolio, isRTL } = useApp();
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const totalUSD = portfolio.reduce((sum, item) => {
    const p = effectivePrice(item, quotes);
    const val = p * item.shares;
    return sum + (item.currency === "ILS" ? val / forex : val);
  }, 0);

  const totalCost = portfolio.reduce((sum, item) => {
    const cost = item.avgPrice * item.shares;
    return sum + (item.currency === "ILS" ? cost / forex : cost);
  }, 0);

  const pnl = totalUSD - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const isUp = pnl >= 0;
  const today = new Date().toLocaleDateString("he-IL");

  async function shareAsImage() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#090c14",
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "stockly-portfolio.png", { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Stockly Portfolio" });
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "stockly-portfolio.png";
          a.click(); URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch {}
    setSharing(false);
  }

  async function exportPDF() {
    setSharing(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(9, 12, 20);
      doc.rect(0, 0, pageW, 40, "F");
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Stockly", 15, 22);
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Portfolio Report · ${today}`, 15, 32);

      // Summary box
      doc.setFillColor(15, 19, 32);
      doc.roundedRect(10, 48, pageW - 20, 32, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`$${totalUSD.toLocaleString("en", { maximumFractionDigits: 0 })}`, 20, 63);
      doc.setFontSize(11);
      doc.setTextColor(isUp ? 34 : 239, isUp ? 197 : 68, isUp ? 94 : 68);
      doc.text(`${isUp ? "+" : ""}$${Math.abs(pnl).toFixed(0)} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`, 20, 73);
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(9);
      doc.text(`≈ ₪${(totalUSD * forex).toLocaleString("he", { maximumFractionDigits: 0 })} · Rate: ${forex.toFixed(3)}`, pageW - 20, 73, { align: "right" });

      // Table header
      let y = 95;
      doc.setFillColor(15, 19, 32);
      doc.rect(10, y - 5, pageW - 20, 8, "F");
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      ["Symbol", "Shares", "Avg Cost", "Price", "Value", "P&L"].forEach((h, i) => {
        const x = 15 + i * (pageW - 30) / 6;
        doc.text(h, x, y);
      });
      y += 6;

      // Table rows
      doc.setFont("helvetica", "normal");
      portfolio.forEach((item) => {
        const price = effectivePrice(item, quotes);
        const val = price * item.shares;
        const valUSD = item.currency === "ILS" ? val / forex : val;
        const costUSD = item.currency === "ILS" ? (item.avgPrice * item.shares) / forex : item.avgPrice * item.shares;
        const rowPnl = valUSD - costUSD;
        const rowPnlPct = costUSD > 0 ? (rowPnl / costUSD) * 100 : 0;

        if (y > 270) { doc.addPage(); y = 20; }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        const cols = [
          item.symbol,
          String(item.shares),
          `$${item.avgPrice.toFixed(2)}`,
          `$${price.toFixed(2)}`,
          `$${valUSD.toFixed(0)}`,
          `${rowPnl >= 0 ? "+" : ""}${rowPnlPct.toFixed(1)}%`,
        ];
        cols.forEach((c, i) => {
          const x = 15 + i * (pageW - 30) / 6;
          if (i === 5) {
            doc.setTextColor(rowPnl >= 0 ? 34 : 239, rowPnl >= 0 ? 197 : 68, rowPnl >= 0 ? 94 : 68);
          }
          doc.text(c, x, y);
          doc.setTextColor(255, 255, 255);
        });

        y += 8;
        doc.setDrawColor(255, 255, 255, 0.05);
        doc.line(10, y - 3, pageW - 10, y - 3);
      });

      // Footer
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(8);
      doc.text("Generated by Stockly · stockly.app", pageW / 2, 285, { align: "center" });

      doc.save(`stockly-report-${today.replace(/\./g, "-")}.pdf`);
    } catch (e) { console.error(e); }
    setSharing(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm" dir={isRTL ? "rtl" : "ltr"}
      onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 bg-brand-surface rounded-t-3xl p-6"
        onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">{isRTL ? "שתף ויצא" : "Share & Export"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Preview card */}
        <div ref={cardRef} className="bg-brand-bg rounded-2xl p-5 mb-5 border border-brand-border">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.svg" alt="Stockly" className="w-7 h-7 rounded-lg" />
            <span className="text-white font-bold text-sm">Stockly</span>
            <span className="text-gray-600 text-xs ms-auto">{today}</span>
          </div>
          <p className="text-gray-400 text-xs mb-1">{isRTL ? "שווי תיק" : "Portfolio Value"}</p>
          <p className="text-white text-3xl font-bold mb-1">
            ${totalUSD.toLocaleString("en", { maximumFractionDigits: 0 })}
          </p>
          <p className={clsx("text-base font-bold mb-4", isUp ? "text-brand-green" : "text-brand-red")}>
            {isUp ? "▲ +" : "▼ "}${Math.abs(pnl).toFixed(0)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {portfolio.slice(0, 4).map(item => {
              const price = effectivePrice(item, quotes);
              const q = quotes[item.symbol];
              const pct = q?.changePercent ?? 0;
              return (
                <div key={item.symbol} className="bg-brand-card rounded-xl p-2.5">
                  <p className="text-white font-bold text-xs">{item.symbol}</p>
                  <p className="text-gray-300 text-xs">${price.toFixed(2)}</p>
                  <p className={clsx("text-[10px] font-semibold", pct >= 0 ? "text-brand-green" : "text-brand-red")}>
                    {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-gray-700 text-[9px] text-center mt-3">stockly.app</p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={shareAsImage} disabled={sharing}
            className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-3.5 text-sm font-semibold transition-all shadow-glow">
            <Share2 size={16} />
            {isRTL ? "שתף תמונה" : "Share Image"}
          </button>
          <button onClick={exportPDF} disabled={sharing}
            className="flex items-center justify-center gap-2 bg-brand-card border border-brand-border hover:border-brand-accent/30 text-white rounded-2xl py-3.5 text-sm font-semibold transition-all">
            <FileText size={16} />
            {isRTL ? "ייצא PDF" : "Export PDF"}
          </button>
        </div>
        {sharing && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-4 h-4 border border-brand-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">{isRTL ? "מכין..." : "Preparing..."}</span>
          </div>
        )}
      </div>
    </div>
  );
}
