import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const range  = req.nextUrl.searchParams.get("range") ?? "1y";
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  const validRanges = ["6mo", "1y", "2y", "3y", "5y"];
  const safeRange = validRanges.includes(range) ? range : "1y";

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1mo&range=${safeRange}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: number[]     = result?.indicators?.quote?.[0]?.close ?? [];
    const points = timestamps
      .map((ts, i) => ({ ts: ts * 1000, price: closes[i] ?? 0 }))
      .filter(p => p.price > 0);
    return NextResponse.json(points);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 502 });
  }
}
