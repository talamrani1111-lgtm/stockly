import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILE = process.env.VERCEL ? "/tmp/push-subscription.json" : path.join(process.cwd(), ".push-subscription.json");

export async function POST(req: NextRequest) {
  const { subscription } = await req.json();
  if (!subscription) return NextResponse.json({ error: "No subscription" }, { status: 400 });
  fs.writeFileSync(FILE, JSON.stringify(subscription, null, 2));
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  try { fs.unlinkSync(FILE); } catch {}
  return NextResponse.json({ ok: true });
}
