import { NextResponse } from "next/server";

async function fetchHistory(yahooSymbol: string): Promise<Array<{ ts: number; value: number }>> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=3mo`,
    { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];
  return timestamps.map((ts, i) => ({ ts: ts * 1000, value: closes[i] ?? 0 })).filter(p => p.value > 0);
}

export async function GET() {
  const [spy, qqq] = await Promise.all([
    fetchHistory("SPY").catch(() => []),
    fetchHistory("QQQ").catch(() => []),
  ]);
  return NextResponse.json({ spy, qqq });
}
