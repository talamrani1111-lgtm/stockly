import { NextRequest, NextResponse } from "next/server";
import { getQuote, SECTOR_SYMBOLS } from "@/lib/finnhub";

export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get("sector");
  const symbolsParam = req.nextUrl.searchParams.get("symbols");

  let symbols: string[];
  if (symbolsParam) {
    symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (sector && SECTOR_SYMBOLS[sector]) {
    symbols = SECTOR_SYMBOLS[sector];
  } else {
    return NextResponse.json({ error: "Invalid sector" }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const q = await getQuote(symbol);
        return {
          symbol,
          price: q.c,
          change: q.d,
          changePercent: q.dp,
          volume: q.t,
          high: q.h,
          low: q.l,
        };
      })
    );

    // sort by absolute % change descending
    results.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    return NextResponse.json(results);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
