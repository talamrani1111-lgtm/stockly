import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getUsers, deleteUser } from "@/lib/users";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await verifyToken(token);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const users = await getUsers();
  const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === caller.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await deleteUser(target.id);

  return NextResponse.json({ ok: true, deleted: target.username });
}
