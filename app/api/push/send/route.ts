import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import fs from "fs";
import path from "path";

const FILE = process.env.VERCEL ? "/tmp/push-subscription.json" : path.join(process.cwd(), ".push-subscription.json");

export async function POST(req: NextRequest) {
  webpush.setVapidDetails(
    "mailto:stockly@app.local",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const { title, body } = await req.json();

  let subscription;
  try {
    subscription = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return NextResponse.json({ error: "No subscription saved. Enable notifications first." }, { status: 404 });
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title: title || "Stockly", body: body || "" }));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
