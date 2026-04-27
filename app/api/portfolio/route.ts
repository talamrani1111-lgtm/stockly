import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/users";
import fs from "fs";
import path from "path";

function getFile(userId: string) {
  const dir = process.env.VERCEL ? "/tmp" : process.cwd();
  return path.join(dir, `portfolio_${userId.replace(/[^a-z0-9]/gi, "_")}.json`);
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json(null);
  const user = verifyToken(token);
  if (!user) return NextResponse.json(null);
  try {
    const data = JSON.parse(fs.readFileSync(getFile(user.id), "utf8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  fs.writeFileSync(getFile(user.id), JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
