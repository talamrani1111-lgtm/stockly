import { NextRequest, NextResponse } from "next/server";
import { yahooQuoteSummary } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  try {
    const result = await yahooQuoteSummary(symbol, "financialData,recommendationTrend");
    const fd = result?.financialData;
    const trend = result?.recommendationTrend?.trend ?? [];

    // Latest quarter breakdown
    const latest = trend[0] ?? null;

    if (!fd) return NextResponse.json({ error: "No data" }, { status: 404 });

    return NextResponse.json({
      targetMean: fd.targetMeanPrice?.raw ?? null,
      targetHigh: fd.targetHighPrice?.raw ?? null,
      targetLow: fd.targetLowPrice?.raw ?? null,
      targetMedian: fd.targetMedianPrice?.raw ?? null,
      recommendation: fd.recommendationKey ?? null,
      numberOfAnalysts: fd.numberOfAnalystOpinions?.raw ?? null,
      breakdown: latest ? {
        strongBuy: latest.strongBuy ?? 0,
        buy: latest.buy ?? 0,
        hold: latest.hold ?? 0,
        sell: latest.sell ?? 0,
        strongSell: latest.strongSell ?? 0,
      } : null,
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
