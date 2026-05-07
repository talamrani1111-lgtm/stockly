import { NextRequest, NextResponse } from "next/server";
import { yahooQuoteSummary } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  try {
    const result = await yahooQuoteSummary(
      symbol,
      "assetProfile,recommendationTrend,earningsTrend,defaultKeyStatistics,financialData"
    );
    if (!result) return NextResponse.json({ error: "No data" }, { status: 404 });

    const ap  = result.assetProfile ?? {};
    const rt  = result.recommendationTrend?.trend ?? [];
    const et  = result.earningsTrend?.trend ?? [];
    const dks = result.defaultKeyStatistics ?? {};
    const fd  = result.financialData ?? {};

    // Latest recommendation snapshot (most recent quarter)
    const rec = rt[0] ?? {};

    // Next quarter & next year EPS estimate
    const nextQtr  = et.find((t: {period: string}) => t.period === "0q");
    const nextYear = et.find((t: {period: string}) => t.period === "+1y");

    return NextResponse.json({
      description: ap.longBusinessSummary ?? null,
      sector: ap.sector ?? null,
      industry: ap.industry ?? null,
      employees: ap.fullTimeEmployees ?? null,
      country: ap.country ?? null,
      website: ap.website ?? null,
      // Analyst recommendations
      recBuy:       (rec.strongBuy ?? 0) + (rec.buy ?? 0),
      recHold:      rec.hold ?? 0,
      recSell:      (rec.sell ?? 0) + (rec.strongSell ?? 0),
      // Growth estimates
      epsNextQtr:   nextQtr?.earningsEstimate?.avg?.raw ?? null,
      revenueNextQtr: nextQtr?.revenueEstimate?.avg?.raw ?? null,
      epsGrowthNextYear: nextYear?.earningsEstimate?.growth?.raw ?? null,
      revenueGrowthNextYear: nextYear?.revenueEstimate?.growth?.raw ?? null,
      // Financial health
      targetPrice:    fd.targetMeanPrice?.raw ?? null,
      recommendationKey: fd.recommendationKey ?? null,
      returnOnEquity: fd.returnOnEquity?.raw ?? null,
      revenueGrowth:  fd.revenueGrowth?.raw ?? null,
      grossMargins:   fd.grossMargins?.raw ?? null,
      debtToEquity:   fd.debtToEquity?.raw ?? null,
      // Additional stats
      forwardEps:     dks.forwardEps?.raw ?? null,
      pegRatio:       dks.pegRatio?.raw ?? null,
      shortFloat:     dks.shortPercentOfFloat?.raw ?? null,
      institutionalOwnership: dks.heldPercentInstitutions?.raw ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
