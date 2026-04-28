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

async function fetchYahooNews(query: string): Promise<NewsItem[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=10&enableFuzzyQuery=false&quotesCount=0`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.news ?? []).map((n: {
      uuid: string; title: string; publisher: string; link: string;
      providerPublishTime: number; relatedTickers?: string[];
      thumbnail?: { resolutions?: { url: string }[] };
    }) => ({
      id: n.uuid,
      headline: n.title,
      summary: "",
      source: n.publisher,
      url: n.link,
      datetime: n.providerPublishTime,
      related: n.relatedTickers?.[0] ?? "",
      image: n.thumbnail?.resolutions?.[0]?.url ?? "",
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols") ?? "";
  const general = req.nextUrl.searchParams.get("general") === "true";

  try {
    if (general) {
      const news = await fetchYahooNews("stock market investing");
      return NextResponse.json(news.slice(0, 30));
    }

    if (symbols) {
      const list = symbols.split(",").map(s => s.trim().toUpperCase()).filter(s => s !== "TA-125");
      if (!list.length) return NextResponse.json([]);

      const results = await Promise.all(list.map(sym => fetchYahooNews(sym)));
      const flat = results.flat();

      const seen = new Set<string>();
      const deduped = flat.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      deduped.sort((a, b) => b.datetime - a.datetime);
      return NextResponse.json(deduped.slice(0, 40));
    }

    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}
