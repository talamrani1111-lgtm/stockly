import { NextResponse } from "next/server";
import { getEarningsCalendar } from "@/lib/finnhub";

function dateStr(daysOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const from = dateStr(0);
    const to = dateStr(7);
    const data = await getEarningsCalendar(from, to);
    return NextResponse.json(data?.earningsCalendar ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
