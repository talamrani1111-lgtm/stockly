import { NextResponse } from "next/server";

// Use exchangerate-api (free, no key needed) as primary, fallback to Finnhub
export async function GET() {
  try {
    // Free exchange rate API - no key required
    const res = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.ILS;
      if (rate) return NextResponse.json({ rate });
    }
  } catch {}

  try {
    // Fallback: Finnhub forex quote
    const key = process.env.FINNHUB_API_KEY;
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=OANDA:USD_ILS&token=${key}`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.c) return NextResponse.json({ rate: data.c });
    }
  } catch {}

  // Last fallback: approximate rate
  return NextResponse.json({ rate: 3.65 });
}
