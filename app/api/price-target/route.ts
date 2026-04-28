import { NextRequest, NextResponse } from "next/server";
import { yahooQuoteSummary } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  try {
    const result = await yahooQuoteSummary(symbol, "financialData,recommendationTrend,upgradeDowngradeHistory");
    const fd = result?.financialData;
    const trend = result?.recommendationTrend?.trend ?? [];
    const history = result?.upgradeDowngradeHistory?.history ?? [];

    const latest = trend[0] ?? null;

    if (!fd) return NextResponse.json({ error: "No data" }, { status: 404 });

    // Recent analyst actions (last 10, deduplicated by firm)
    const seen = new Set<string>();
    const actions = (history as Array<{
      firm: string; toGrade: string; fromGrade: string; action: string; epochGradeDate: number;
    }>)
      .filter(h => {
        if (seen.has(h.firm)) return false;
        seen.add(h.firm);
        return true;
      })
      .slice(0, 10)
      .map(h => ({
        firm: h.firm,
        toGrade: h.toGrade ?? "",
        fromGrade: h.fromGrade ?? "",
        action: h.action ?? "",
        date: h.epochGradeDate ? new Date(h.epochGradeDate * 1000).toISOString().split("T")[0] : "",
      }));

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
      trend: trend.slice(0, 4).map((t: { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }) => ({
        period: t.period,
        strongBuy: t.strongBuy ?? 0,
        buy: t.buy ?? 0,
        hold: t.hold ?? 0,
        sell: t.sell ?? 0,
        strongSell: t.strongSell ?? 0,
      })),
      actions,
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
