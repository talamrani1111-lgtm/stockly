import { NextResponse } from "next/server";
import webpush from "web-push";
import fs from "fs";
import path from "path";

const SUB_FILE = process.env.VERCEL ? "/tmp/push-subscription.json" : path.join(process.cwd(), ".push-subscription.json");

const DEFAULT_PORTFOLIO = [
  { symbol: "QQQ", shares: 5, avgPrice: 600, currency: "USD" },
  { symbol: "VOO", shares: 7, avgPrice: 629, currency: "USD" },
  { symbol: "SOFI", shares: 18, avgPrice: 18.73, currency: "USD" },
];

export async function GET() {
  try {
    webpush.setVapidDetails(
      "mailto:stockly@app.local",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    // Load saved portfolio from app state if available (fallback to defaults)
    let portfolio = DEFAULT_PORTFOLIO;
    const stateFile = path.join(process.cwd(), ".app-state.json");
    try {
      const s = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      if (s.portfolio?.length) portfolio = s.portfolio;
    } catch {}

    const usSymbols = portfolio.filter((p: { currency?: string }) => p.currency !== "ILS").map((p: { symbol: string }) => p.symbol);
    const symbolsQuery = usSymbols.join(",");

    // Fetch quotes
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const [quotesRes, forexRes] = await Promise.all([
      fetch(`${baseUrl}/api/stocks?symbols=${symbolsQuery},SPY`),
      fetch(`${baseUrl}/api/forex`),
    ]);
    const quotes: Array<{ symbol: string; price: number; changePercent: number }> = await quotesRes.json();
    const forex = await forexRes.json();
    const rate = forex.rate ?? 3.65;

    const quoteMap: Record<string, { price: number; changePercent: number }> = {};
    quotes.forEach(q => { quoteMap[q.symbol] = q; });

    // Calculate portfolio value and daily change
    let totalValue = 0;
    let totalCost = 0;
    const lines: string[] = [];

    for (const item of portfolio as Array<{ symbol: string; shares: number; avgPrice: number; currency?: string; manualPrice?: number }>) {
      const q = quoteMap[item.symbol];
      if (!q) continue;
      const price = q.price;
      const val = price * item.shares;
      const valUSD = item.currency === "ILS" ? val / rate : val;
      const costUSD = item.currency === "ILS" ? (item.avgPrice * item.shares) / rate : item.avgPrice * item.shares;
      totalValue += valUSD;
      totalCost += costUSD;
      const pct = q.changePercent;
      const arrow = pct >= 0 ? "▲" : "▼";
      lines.push(`${item.symbol} ${arrow}${Math.abs(pct).toFixed(2)}%`);
    }

    const pnlTotal = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnlTotal / totalCost) * 100 : 0;
    const spy = quoteMap["SPY"];
    const spyLine = spy ? ` · SPY ${spy.changePercent >= 0 ? "▲" : "▼"}${Math.abs(spy.changePercent).toFixed(2)}%` : "";

    const body = [
      `תיק: $${totalValue.toLocaleString("en", { maximumFractionDigits: 0 })} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`,
      lines.join(" · "),
      `שוק${spyLine} · ₪/$ ${rate.toFixed(3)}`,
    ].join("\n");

    // Send push
    const subscription = JSON.parse(fs.readFileSync(SUB_FILE, "utf8"));
    await webpush.sendNotification(subscription, JSON.stringify({
      title: `📈 Stockly — בוקר טוב!`,
      body,
    }));

    return NextResponse.json({ ok: true, body });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
