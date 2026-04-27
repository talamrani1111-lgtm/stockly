import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/finnhub";

// Israeli indices via Yahoo Finance (Finnhub doesn't support them)
const YAHOO_SYMBOLS: Record<string, string> = {
  "TA-125": "%5ETA125.TA",
  "TA-35": "%5ETA35.TA",
};

async function getYahooQuote(symbol: string, yahooSymbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) throw new Error(`Yahoo fetch failed: ${symbol}`);
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`No data for ${symbol}`);

  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = meta.regularMarketChange ?? (price - prevClose);
  const changePercent = meta.regularMarketChangePercent ?? (prevClose > 0 ? (change / prevClose) * 100 : 0);

  return { symbol, price, change, changePercent, high: meta.regularMarketDayHigh ?? price, low: meta.regularMarketDayLow ?? price, open: meta.regularMarketOpen ?? price, prevClose };
}

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols");
  if (!symbols) return NextResponse.json({ error: "No symbols" }, { status: 400 });

  const list = symbols.split(",").map((s) => s.trim().toUpperCase());

  const results = await Promise.all(
    list.map(async (symbol) => {
      try {
        // Israeli indices → Yahoo Finance
        if (YAHOO_SYMBOLS[symbol]) {
          return await getYahooQuote(symbol, YAHOO_SYMBOLS[symbol]);
        }
        // US stocks → Finnhub
        const quote = await getQuote(symbol);
        return {
          symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          high: quote.h,
          low: quote.l,
          open: quote.o,
          prevClose: quote.pc,
        };
      } catch {
        return { symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0 };
      }
    })
  );

  return NextResponse.json(results);
}
