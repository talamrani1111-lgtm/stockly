import { NextRequest, NextResponse } from "next/server";
import { yahooQuoteSummary } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  try {
    const result = await yahooQuoteSummary(symbol, "summaryDetail,defaultKeyStatistics,price");
    if (!result) return NextResponse.json({ error: "No data" }, { status: 404 });

    const sd = result.summaryDetail ?? {};
    const dks = result.defaultKeyStatistics ?? {};
    const p = result.price ?? {};

    return NextResponse.json({
      shortName: p.shortName ?? p.longName ?? symbol,
      marketCap: p.marketCap?.raw ?? null,
      peRatio: sd.trailingPE?.raw ?? null,
      forwardPE: sd.forwardPE?.raw ?? null,
      eps: dks.trailingEps?.raw ?? null,
      beta: sd.beta?.raw ?? null,
      fiftyTwoWeekHigh: sd.fiftyTwoWeekHigh?.raw ?? null,
      fiftyTwoWeekLow: sd.fiftyTwoWeekLow?.raw ?? null,
      avgVolume: sd.averageVolume?.raw ?? null,
      dividendYield: sd.dividendYield?.raw ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
