import { NextRequest, NextResponse } from "next/server";
import { SECTOR_SYMBOLS } from "@/lib/finnhub";

async function getYahooQuote(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
    { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Yahoo fetch failed: ${symbol}`);
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`No data for ${symbol}`);

  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = meta.regularMarketChange ?? (price - prevClose);
  const changePercent = meta.regularMarketChangePercent ?? (prevClose > 0 ? (change / prevClose) * 100 : 0);

  return {
    symbol,
    price,
    change,
    changePercent,
    high: meta.regularMarketDayHigh ?? price,
    low: meta.regularMarketDayLow ?? price,
    volume: meta.regularMarketVolume ?? 0,
    marketCap: meta.marketCap ?? null,
  };
}

export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get("sector");
  const symbolsParam = req.nextUrl.searchParams.get("symbols");

  let symbols: string[];
  if (symbolsParam) {
    symbols = symbolsParam.split(",").map(s => s.trim()).filter(Boolean);
  } else if (sector && SECTOR_SYMBOLS[sector]) {
    symbols = SECTOR_SYMBOLS[sector];
  } else {
    return NextResponse.json({ error: "Invalid sector" }, { status: 400 });
  }

  const results = await Promise.allSettled(symbols.map(sym => getYahooQuote(sym)));
  const data = results
    .filter((r): r is PromiseFulfilledResult<ReturnType<typeof getYahooQuote> extends Promise<infer T> ? T : never> => r.status === "fulfilled")
    .map(r => r.value);

  data.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  return NextResponse.json(data);
}
