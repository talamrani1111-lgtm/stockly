import { NextResponse } from "next/server";

const SECTOR_ETFS = [
  { symbol: "XLK",  name: "טכנולוגיה",    nameEn: "Technology"        },
  { symbol: "XLF",  name: "פיננסים",      nameEn: "Financials"        },
  { symbol: "XLE",  name: "אנרגיה",       nameEn: "Energy"            },
  { symbol: "XLV",  name: "בריאות",       nameEn: "Healthcare"        },
  { symbol: "XLI",  name: "תעשייה",       nameEn: "Industrials"       },
  { symbol: "XLY",  name: "צריכה שיקולית",nameEn: "Cons. Disc."       },
  { symbol: "XLP",  name: "צריכה בסיסית", nameEn: "Cons. Staples"     },
  { symbol: "XLRE", name: "נדל\"ן",        nameEn: "Real Estate"       },
  { symbol: "XLU",  name: "שירותים",      nameEn: "Utilities"         },
  { symbol: "XLB",  name: "חומרי גלם",    nameEn: "Materials"         },
  { symbol: "XLC",  name: "תקשורת",       nameEn: "Comm. Services"    },
];

export async function GET() {
  try {
    const symbols = SECTOR_ETFS.map(e => e.symbol).join(",");
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error("Yahoo error");
    const data = await res.json();
    const quotes: { symbol: string; regularMarketChangePercent: number }[] =
      data?.quoteResponse?.result ?? [];

    const map: Record<string, number> = {};
    quotes.forEach(q => { map[q.symbol] = q.regularMarketChangePercent ?? 0; });

    const result = SECTOR_ETFS.map(e => ({
      symbol: e.symbol,
      name: e.name,
      nameEn: e.nameEn,
      changePercent: map[e.symbol] ?? 0,
    })).sort((a, b) => b.changePercent - a.changePercent);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
