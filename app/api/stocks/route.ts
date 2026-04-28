import { NextRequest, NextResponse } from "next/server";

// Map display symbols → Yahoo Finance symbols
const YAHOO_MAP: Record<string, string> = {
  "TA-125": "%5ETA125.TA",
  "TA-35": "%5ETA35.TA",
};

// Israeli index symbols: Yahoo returns the full index level (e.g. 4257),
// but ETF units trade at 1/100 of that (~42 NIS). Divide to show real unit price.
const PRICE_DIVISOR: Record<string, number> = {
  "TA-125": 100,
  "TA-35": 100,
};

async function getYahooQuote(symbol: string) {
  const yahooSym = YAHOO_MAP[symbol] ?? encodeURIComponent(symbol);
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=2d`,
    { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Yahoo fetch failed: ${symbol}`);
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`No data for ${symbol}`);

  const divisor = PRICE_DIVISOR[symbol] ?? 1;
  const rawPrice = meta.regularMarketPrice ?? 0;
  const rawPrev = meta.chartPreviousClose ?? meta.previousClose ?? rawPrice;
  const price = rawPrice / divisor;
  const prevClose = rawPrev / divisor;
  const change = meta.regularMarketChange != null ? meta.regularMarketChange / divisor : price - prevClose;
  const changePercent = meta.regularMarketChangePercent ?? (prevClose > 0 ? (change / prevClose) * 100 : 0);

  return {
    symbol,
    price,
    change,
    changePercent,
    high: (meta.regularMarketDayHigh ?? rawPrice) / divisor,
    low: (meta.regularMarketDayLow ?? rawPrice) / divisor,
    open: (meta.regularMarketOpen ?? rawPrice) / divisor,
    prevClose,
  };
}

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols");
  if (!symbols) return NextResponse.json({ error: "No symbols" }, { status: 400 });

  const list = symbols.split(",").map((s) => s.trim().toUpperCase());

  const results = await Promise.all(
    list.map(async (symbol) => {
      try {
        return await getYahooQuote(symbol);
      } catch {
        return { symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0 };
      }
    })
  );

  return NextResponse.json(results);
}
