import { NextRequest, NextResponse } from "next/server";
import { kvSet, kvGet } from "@/lib/kv";
import fs from "fs";
import path from "path";

const FILE = process.env.VERCEL ? "/tmp/push-sub.json" : path.join(process.cwd(), ".push-subscription.json");

async function saveSub(sub: unknown) {
  await kvSet("push:subscription", sub);
  try { fs.writeFileSync(FILE, JSON.stringify(sub)); } catch {}
}

export async function GET() {
  const kv = await kvGet("push:subscription");
  if (kv) return NextResponse.json({ subscription: kv });
  try {
    const file = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return NextResponse.json({ subscription: file });
  } catch {}
  return NextResponse.json({ subscription: null });
}

export async function POST(req: NextRequest) {
  const { subscription } = await req.json();
  if (!subscription) return NextResponse.json({ error: "No subscription" }, { status: 400 });
  await saveSub(subscription);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await kvSet("push:subscription", null);
  try { fs.unlinkSync(FILE); } catch {}
  return NextResponse.json({ ok: true });
}
