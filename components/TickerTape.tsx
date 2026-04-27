"use client";
import { useEffect, useState, useRef } from "react";
import { useApp } from "@/lib/context";

type TickerItem = { symbol: string; price: number; changePercent: number };

const POPULAR = ["SPY", "NVDA", "AAPL", "TSLA", "META", "MSFT", "AMZN"];

export default function TickerTape() {
  const { portfolio } = useApp();
  const [items, setItems] = useState<TickerItem[]>([]);
  const prevRef = useRef<string>("");

  useEffect(() => {
    const portfolioSymbols = portfolio.map((p) => p.symbol).filter((s) => s !== "TA-125");
    const all = Array.from(new Set([...portfolioSymbols, ...POPULAR]));
    const key = all.join(",");
    if (key === prevRef.current) return;
    prevRef.current = key;

    fetch(`/api/stocks?symbols=${all.join(",")}`)
      .then((r) => r.json())
      .then((data: TickerItem[]) => setItems(data.filter((d) => d.price > 0)))
      .catch(() => {});

    const id = setInterval(() => {
      fetch(`/api/stocks?symbols=${all.join(",")}`)
        .then((r) => r.json())
        .then((data: TickerItem[]) => setItems(data.filter((d) => d.price > 0)))
        .catch(() => {});
    }, 90000);
    return () => clearInterval(id);
  }, [portfolio]);

  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden bg-[#080b12] border-b border-white/[0.05] py-1.5 select-none">
      <div
        className="flex whitespace-nowrap"
        style={{
          width: "max-content",
          animation: `ticker ${items.length * 4}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => {
          const up = item.changePercent >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 text-[11px]">
              <span className="text-gray-500 font-medium tracking-wide">{item.symbol}</span>
              <span className="text-white font-bold">
                {item.price >= 100 ? `$${item.price.toFixed(1)}` : `$${item.price.toFixed(2)}`}
              </span>
              <span className={up ? "text-brand-green font-semibold" : "text-brand-red font-semibold"}>
                {up ? "▲" : "▼"}&nbsp;{Math.abs(item.changePercent).toFixed(2)}%
              </span>
              <span className="text-white/[0.06] text-base">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
