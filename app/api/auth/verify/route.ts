import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyToken } from "@/lib/users";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ valid: false }, { status: 401 });

  // Check multi-user system first
  const user = await verifyToken(token);
  if (user) {
    return NextResponse.json({ valid: true, username: user.username, role: user.role });
  }

  // Legacy single-user fallback (APP_USERNAME / APP_PASSWORD env vars)
  const validUser = process.env.APP_USERNAME ?? "admin";
  const validPass = process.env.APP_PASSWORD ?? "1234";
  const secret = process.env.APP_SECRET ?? "stock-tracker-secret-2026";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${validUser}:${validPass}`)
    .digest("hex");

  if (token === expected) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
