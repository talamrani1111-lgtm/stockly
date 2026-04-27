import { NextRequest, NextResponse } from "next/server";

const BASE = "https://finnhub.io/api/v1";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 1) return NextResponse.json([]);

  const key = process.env.FINNHUB_API_KEY;
  if (!key) return NextResponse.json([]);

  try {
    const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&token=${key}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();

    const results = (data.result ?? [])
      .filter((r: { type: string }) => ["Common Stock", "ETP", "ETF"].includes(r.type))
      .slice(0, 8)
      .map((r: { symbol: string; description: string; displaySymbol: string }) => ({
        symbol: r.displaySymbol ?? r.symbol,
        name: r.description,
      }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
