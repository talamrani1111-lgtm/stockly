import { NextResponse } from "next/server";

type HebrewNewsItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
  lang: "he";
};

async function fetchGoogleNews(query: string, label: string): Promise<HebrewNewsItem[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=he&gl=IL&ceid=IL:he`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: HebrewNewsItem[] = [];
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    for (const match of matches) {
      const block = match[1];

      const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim() ?? "";

      // Google News link is inside description href
      const rawLink = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";

      // Source appears at end of title after " - "
      const titleParts = title.split(" - ");
      const source = titleParts.length > 1 ? titleParts[titleParts.length - 1] : label;
      const cleanTitle = titleParts.length > 1 ? titleParts.slice(0, -1).join(" - ") : title;

      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
      const timestamp = pubDate ? Math.floor(Date.parse(pubDate) / 1000) : Math.floor(Date.now() / 1000);

      if (!cleanTitle || !rawLink) continue;

      // Filter: must have Hebrew chars in title
      const hasHebrew = /[\u0590-\u05FF]/.test(cleanTitle);
      if (!hasHebrew) continue;

      // Filter out known non-Israeli sources
      const blockedSources = ["vietnam", "xinhua", "arabic", "china", "india"];
      if (blockedSources.some((b) => source.toLowerCase().includes(b))) continue;

      items.push({
        id: rawLink,
        headline: cleanTitle,
        summary: "",
        source,
        url: rawLink,
        datetime: timestamp,
        lang: "he",
      });
    }

    return items;
  } catch {
    return [];
  }
}

const ISRAELI_DOMAINS = [
  "globes.co.il", "themarker.com", "calcalist.co.il", "ynet.co.il",
  "maariv.co.il", "haaretz.co.il", "bizportal.co.il", "ice.co.il",
  "walla.co.il", "mako.co.il", "n12.co.il", "news.co.il",
];

function isIsraeliSource(url: string): boolean {
  return ISRAELI_DOMAINS.some((d) => url.includes(d));
}

export async function GET() {
  const [stocks, market, tech] = await Promise.all([
    fetchGoogleNews("בורסה מניות ישראל", "כלכלה"),
    fetchGoogleNews("שוק ההון ישראל השקעות", "שוק ההון"),
    fetchGoogleNews("טכנולוגיה סטארטאפ ישראל", "טק"),
  ]);

  const all = [...stocks, ...market, ...tech];

  // Deduplicate
  const seen = new Set<string>();
  const unique = all.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  unique.sort((a, b) => b.datetime - a.datetime);

  return NextResponse.json(unique.slice(0, 40));
}
