import { NextRequest, NextResponse } from "next/server";
import { getCompanyNews, getMarketNews } from "@/lib/finnhub";

function dateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols") ?? "";
  const general = req.nextUrl.searchParams.get("general") === "true";

  const from = dateStr(7);
  const to = dateStr(0);

  try {
    let items: unknown[] = [];

    if (general) {
      const news = await getMarketNews("general");
      items = news.slice(0, 30);
    } else if (symbols) {
      // TA-125 is an Israeli index — skip for Finnhub news, use Hebrew news instead
      const list = symbols.split(",").map((s) => s.trim().toUpperCase()).filter((s) => s !== "TA-125");
      const all = await Promise.all(
        list.map((sym) => getCompanyNews(sym, from, to).catch(() => []))
      );
      const flat = all.flat() as Array<{ datetime: number }>;
      // deduplicate by id and sort by date
      const seen = new Set<number>();
      for (const item of flat) {
        if (!seen.has((item as { id?: number }).id as number)) {
          seen.add((item as { id?: number }).id as number);
          items.push(item);
        }
      }
      items.sort(
        (a, b) =>
          (b as { datetime: number }).datetime - (a as { datetime: number }).datetime
      );
      items = items.slice(0, 40);
    }

    return NextResponse.json(items);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
