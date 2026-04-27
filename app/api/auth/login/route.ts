import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findUser, verifyPassword, makeToken } from "@/lib/users";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  // Try new multi-user system first
  const user = findUser(username);
  if (user) {
    const ok = await verifyPassword(user, password);
    if (!ok) return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });
    if (!user.emailVerified) return NextResponse.json({ error: "יש לאמת את כתובת האימייל תחילה", needsVerification: true, userId: user.id }, { status: 403 });
    return NextResponse.json({ token: makeToken(user.id) });
  }

  // Legacy single-user fallback
  const validUser = process.env.APP_USERNAME ?? "admin";
  const validPass = process.env.APP_PASSWORD ?? "1234";
  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });
  }
  const secret = process.env.APP_SECRET ?? "stock-tracker-secret-2026";
  const token = crypto.createHmac("sha256", secret).update(`${username}:${password}`).digest("hex");
  return NextResponse.json({ token });
}
