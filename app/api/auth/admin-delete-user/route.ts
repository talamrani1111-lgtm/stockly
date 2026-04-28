import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getUsers } from "@/lib/users";
import fs from "fs";
import path from "path";

const DB_FILE = process.env.VERCEL ? "/tmp/users.json" : path.join(process.cwd(), ".users.json");

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = verifyToken(token);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const users = getUsers();
  const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === caller.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  const updated = users.filter(u => u.id !== target.id);
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  db.users = updated;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  return NextResponse.json({ ok: true, deleted: target.username });
}
