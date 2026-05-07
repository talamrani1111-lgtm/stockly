import { NextRequest, NextResponse } from "next/server";
import { yahooQuoteSummary } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  if (!symbols.length) return NextResponse.json([]);

  const results = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const data = await yahooQuoteSummary(sym, "summaryDetail,defaultKeyStatistics");
        const sd  = data?.summaryDetail ?? {};
        const dks = data?.defaultKeyStatistics ?? {};
        return {
          symbol: sym,
          annualDividend: sd.dividendRate?.raw ?? null,
          dividendYield: sd.dividendYield?.raw ?? null,
          exDividendDate: sd.exDividendDate?.raw ? sd.exDividendDate.raw * 1000 : null,
          payoutRatio: sd.payoutRatio?.raw ?? null,
          fiveYearAvgYield: dks.fiveYearAverageReturn?.raw ?? null,
          trailingAnnualDividendYield: sd.trailingAnnualDividendYield?.raw ?? null,
          trailingAnnualDividendRate: sd.trailingAnnualDividendRate?.raw ?? null,
        };
      } catch {
        return { symbol: sym, annualDividend: null };
      }
    })
  );

  return NextResponse.json(results.filter(r => r.annualDividend != null && r.annualDividend > 0));
}
