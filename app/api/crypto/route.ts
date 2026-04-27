import { NextRequest, NextResponse } from "next/server";
import { COIN_IDS } from "@/lib/coinIds";

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = param.split(",").map(s => s.toUpperCase()).filter(Boolean);
  if (!symbols.length) return NextResponse.json([]);

  const ids = symbols.map(s => COIN_IDS[s]).filter(Boolean);
  if (!ids.length) return NextResponse.json(symbols.map(s => ({ symbol: s, price: 0, changePercent: 0 })));

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      { next: { revalidate: 60 }, headers: { accept: "application/json" } }
    );
    const data = await res.json();

    const result = symbols.map(sym => {
      const id = COIN_IDS[sym];
      const coin = id ? data[id] : null;
      return {
        symbol: sym,
        id: id ?? sym.toLowerCase(),
        price: coin?.usd ?? 0,
        changePercent: coin?.usd_24h_change ?? 0,
        marketCap: coin?.usd_market_cap ?? 0,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(symbols.map(s => ({ symbol: s, price: 0, changePercent: 0 })));
  }
}
