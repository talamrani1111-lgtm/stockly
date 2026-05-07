import { NextRequest, NextResponse } from "next/server";

type NewsItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  related?: string;
  image?: string;
};

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchYahooRSS(symbol: string): Promise<NewsItem[]> {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    for (const match of matches) {
      const block = match[1];
      const title = decodeHtml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
      const guid = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? link;
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
      const summary = decodeHtml(
        (block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "")
          .replace(/<[^>]+>/g, "")
      );
      if (!title || !link) continue;
      items.push({
        id: guid,
        headline: title,
        summary: summary.slice(0, 200),
        source: "Yahoo Finance",
        url: link,
        datetime: pubDate ? Math.floor(Date.parse(pubDate) / 1000) : Math.floor(Date.now() / 1000),
        related: symbol !== "SPY,QQQ,NVDA" ? symbol : undefined,
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols") ?? "";
  const general = req.nextUrl.searchParams.get("general") === "true";

  try {
    let allItems: NewsItem[] = [];

    if (general) {
      allItems = await fetchYahooRSS("SPY,QQQ,NVDA");
    } else if (symbols) {
      const list = symbols.split(",").map(s => s.trim().toUpperCase()).filter(s => s !== "TA-125");
      if (!list.length) return NextResponse.json([]);
      const results = await Promise.all(list.slice(0, 5).map(sym => fetchYahooRSS(sym)));
      allItems = results.flat();
    } else {
      return NextResponse.json([]);
    }

    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    deduped.sort((a, b) => b.datetime - a.datetime);
    return NextResponse.json(deduped.slice(0, 40));
  } catch {
    return NextResponse.json([]);
  }
}
