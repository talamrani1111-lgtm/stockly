const BASE = "https://finnhub.io/api/v1";

function apiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY is not set");
  return key;
}

export async function getQuote(symbol: string) {
  const res = await fetch(
    `${BASE}/quote?symbol=${symbol}&token=${apiKey()}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Quote fetch failed: ${symbol}`);
  return res.json();
}

export async function getCompanyNews(symbol: string, from: string, to: string) {
  const res = await fetch(
    `${BASE}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey()}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`News fetch failed: ${symbol}`);
  return res.json();
}

export async function getMarketNews(category: string = "general") {
  const res = await fetch(
    `${BASE}/news?category=${category}&token=${apiKey()}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Market news fetch failed");
  return res.json();
}

export async function getForexRate(from: string, to: string) {
  const res = await fetch(
    `${BASE}/forex/rates?base=${from}&token=${apiKey()}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("Forex fetch failed");
  const data = await res.json();
  return data.quote?.[to] ?? null;
}

export async function getEarningsCalendar(from: string, to: string) {
  const res = await fetch(
    `${BASE}/calendar/earnings?from=${from}&to=${to}&token=${apiKey()}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Earnings calendar fetch failed");
  return res.json();
}

// Screener: get basic financials to find volatile stocks in a category
export async function getSymbolsByExchange(exchange: string = "US") {
  const res = await fetch(
    `${BASE}/stock/symbol?exchange=${exchange}&token=${apiKey()}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error("Symbols fetch failed");
  return res.json();
}

// Sector map used in screener API route
export const SECTOR_SYMBOLS: Record<string, string[]> = {
  technology: ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMD", "INTC", "TSLA", "ORCL", "CRM"],
  energy: ["XOM", "CVX", "COP", "SLB", "OXY", "MPC", "VLO", "PSX", "HAL", "DVN"],
  construction: ["CAT", "DE", "VMC", "MLM", "NUE", "X", "URI", "PWR", "FLR", "JCI"],
  ai: ["NVDA", "MSFT", "GOOGL", "META", "AMZN", "PLTR", "AI", "SOUN", "BBAI", "RKLB"],
  space: ["LMT", "RTX", "NOC", "BA", "GD", "RKLB", "SPCE", "ASTR", "ASTS", "HII"],
};
