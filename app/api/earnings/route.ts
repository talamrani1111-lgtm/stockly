import { NextRequest, NextResponse } from "next/server";
import { yahooQuoteSummary } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  if (!symbols.length) return NextResponse.json([]);

  const results = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const data = await yahooQuoteSummary(sym, "calendarEvents,defaultKeyStatistics");
        const cal = data?.calendarEvents ?? {};
        const dks = data?.defaultKeyStatistics ?? {};
        const earnings = cal.earnings ?? {};
        const dates: number[] = earnings.earningsDate?.map((d: { raw: number }) => d.raw * 1000) ?? [];
        const nextDate = dates.find(d => d > Date.now()) ?? dates[0] ?? null;
        return {
          symbol: sym,
          nextEarningsDate: nextDate,
          epsEstimate: earnings.earningsAverage?.raw ?? null,
          revenueEstimate: earnings.revenueAverage?.raw ?? null,
          fiscalYearEnd: cal.exDividendDate?.raw ?? null,
          lastFiscalYearEps: dks.trailingEps?.raw ?? null,
        };
      } catch {
        return { symbol: sym, nextEarningsDate: null };
      }
    })
  );

  return NextResponse.json(results);
}
