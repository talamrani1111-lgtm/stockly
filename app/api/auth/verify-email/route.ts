import { NextRequest, NextResponse } from "next/server";
import { verifyCode, findUserById, makeToken } from "@/lib/users";

export async function POST(req: NextRequest) {
  const { userId, code } = await req.json();
  if (!userId || !code) return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });

  const ok = verifyCode(userId, "email", code);
  if (!ok) return NextResponse.json({ error: "קוד שגוי או פג תוקף" }, { status: 400 });

  const user = findUserById(userId);
  if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });

  const token = makeToken(user.id);
  return NextResponse.json({ token, username: user.username });
}
