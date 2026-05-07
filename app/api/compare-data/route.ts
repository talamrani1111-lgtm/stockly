import { NextRequest, NextResponse } from "next/server";
import { yahooQuoteSummary } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  if (!symbols.length) return NextResponse.json([]);

  const results = await Promise.all(
    symbols.map(async (sym) => {
      try {
        // v7 quote — no crumb needed, returns rich data
        const qRes = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${sym}`,
          { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }, next: { revalidate: 60 } }
        );
        const qData = await qRes.json();
        const q = qData?.quoteResponse?.result?.[0] ?? {};

        // Profile + earnings — crumb based but cached
        let profile: Record<string, unknown> = {};
        try {
          const pData = await yahooQuoteSummary(
            sym,
            "assetProfile,recommendationTrend,earningsTrend,financialData,defaultKeyStatistics,calendarEvents"
          );
          profile = pData ?? {};
        } catch {}

        const ap   = (profile.assetProfile  as Record<string, unknown>) ?? {};
        const rt   = (profile.recommendationTrend as { trend?: unknown[] })?.trend ?? [];
        const et   = (profile.earningsTrend as { trend?: unknown[] })?.trend ?? [];
        const fd   = (profile.financialData  as Record<string, unknown>) ?? {};
        const dks  = (profile.defaultKeyStatistics as Record<string, unknown>) ?? {};
        const cal  = (profile.calendarEvents  as Record<string, unknown>) ?? {};

        const rec  = (rt[0] ?? {}) as Record<string, number>;
        const nextQtr  = (et as Array<{period: string; earningsEstimate?: {avg?: {raw?: number}; growth?: {raw?: number}}; revenueEstimate?: {avg?: {raw?: number}; growth?: {raw?: number}}}>).find(t => t.period === "0q");
        const nextYear = (et as Array<{period: string; earningsEstimate?: {avg?: {raw?: number}; growth?: {raw?: number}}; revenueEstimate?: {avg?: {raw?: number}; growth?: {raw?: number}}}>).find(t => t.period === "+1y");

        type CalEarnings = { earningsDate?: Array<{raw: number}>; earningsAverage?: {raw?: number} };
        const earnings = (cal.earnings ?? {}) as CalEarnings;
        const earnDates = earnings.earningsDate?.map((d: {raw: number}) => d.raw * 1000) ?? [];
        const nextEarnings = earnDates.find((d: number) => d > Date.now()) ?? null;

        return {
          symbol: sym,
          // Price data (v7)
          price:           q.regularMarketPrice               ?? 0,
          change:          q.regularMarketChange              ?? 0,
          changePercent:   q.regularMarketChangePercent       ?? 0,
          marketCap:       q.marketCap                        ?? null,
          pe:              q.trailingPE                       ?? null,
          forwardPE:       q.forwardPE                        ?? null,
          beta:            q.beta                             ?? null,
          week52High:      q.fiftyTwoWeekHigh                 ?? null,
          week52Low:       q.fiftyTwoWeekLow                  ?? null,
          dividendYield:   q.trailingAnnualDividendYield      ?? null,
          avgVolume:       q.averageDailyVolume3Month          ?? null,
          eps:             q.epsTrailingTwelveMonths          ?? null,
          shortName:       q.shortName ?? q.longName          ?? sym,
          priceToBook:     q.priceToBook                      ?? null,
          // Profile
          description:     (ap.longBusinessSummary as string) ?? null,
          sector:          (ap.sector as string)               ?? null,
          industry:        (ap.industry as string)             ?? null,
          employees:       (ap.fullTimeEmployees as number)    ?? null,
          country:         (ap.country as string)              ?? null,
          website:         (ap.website as string)              ?? null,
          founded:         (ap.companyOfficers as unknown[])   ?? null,
          // Financials
          grossMargins:    (fd.grossMargins as {raw?: number})?.raw          ?? null,
          operatingMargins:(fd.operatingMargins as {raw?: number})?.raw      ?? null,
          returnOnEquity:  (fd.returnOnEquity as {raw?: number})?.raw        ?? null,
          debtToEquity:    (fd.debtToEquity as {raw?: number})?.raw          ?? null,
          revenueGrowth:   (fd.revenueGrowth as {raw?: number})?.raw         ?? null,
          grossProfit:     (fd.grossProfits as {raw?: number})?.raw          ?? null,
          totalCash:       (fd.totalCash as {raw?: number})?.raw             ?? null,
          totalDebt:       (fd.totalDebt as {raw?: number})?.raw             ?? null,
          freeCashFlow:    (fd.freeCashflow as {raw?: number})?.raw          ?? null,
          targetPrice:     (fd.targetMeanPrice as {raw?: number})?.raw       ?? null,
          recommendationKey: (fd.recommendationKey as string)                ?? null,
          // Key stats
          pegRatio:        (dks.pegRatio as {raw?: number})?.raw             ?? null,
          shortFloat:      (dks.shortPercentOfFloat as {raw?: number})?.raw  ?? null,
          institutionalPct:(dks.heldPercentInstitutions as {raw?: number})?.raw ?? null,
          insiderPct:      (dks.heldPercentInsiders as {raw?: number})?.raw  ?? null,
          forwardEps:      (dks.forwardEps as {raw?: number})?.raw           ?? null,
          // Analyst
          recBuy:    (rec.strongBuy  ?? 0) + (rec.buy  ?? 0),
          recHold:    rec.hold  ?? 0,
          recSell:   (rec.sell ?? 0) + (rec.strongSell ?? 0),
          // Growth estimates
          epsGrowthNextYear:     nextYear?.earningsEstimate?.growth?.raw ?? null,
          revenueGrowthNextYear: nextYear?.revenueEstimate?.growth?.raw  ?? null,
          epsEstNextQtr:         nextQtr?.earningsEstimate?.avg?.raw     ?? null,
          // Earnings
          nextEarningsDate: nextEarnings,
          epsEstimate:      earnings.earningsAverage?.raw ?? null,
        };
      } catch (e) {
        console.error("compare-data error for", sym, e);
        return { symbol: sym, price: 0 };
      }
    })
  );

  return NextResponse.json(results);
}
