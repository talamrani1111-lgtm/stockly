import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/users";
import { kvGet, kvSet } from "@/lib/kv";
import fs from "fs";
import path from "path";

function localFile(userId: string) {
  return path.join(process.cwd(), `portfolio_${userId.replace(/[^a-z0-9]/gi, "_")}.json`);
}

async function load(userId: string) {
  // Try Redis first (persistent, cross-device)
  const remote = await kvGet<unknown[]>(`portfolio:${userId}`);
  if (remote) return remote;
  // Fallback to local file (dev)
  try { return JSON.parse(fs.readFileSync(localFile(userId), "utf8")); } catch { return null; }
}

async function save(userId: string, data: unknown) {
  await kvSet(`portfolio:${userId}`, data);
  try { fs.writeFileSync(localFile(userId), JSON.stringify(data)); } catch {}
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json(null);
  const user = verifyToken(token);
  if (!user) return NextResponse.json(null);
  const data = await load(user.id);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await save(user.id, body);
  return NextResponse.json({ ok: true });
}
