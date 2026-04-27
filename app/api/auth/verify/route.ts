import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  const validUser = process.env.APP_USERNAME ?? "admin";
  const validPass = process.env.APP_PASSWORD ?? "1234";
  const secret = process.env.APP_SECRET ?? "stock-tracker-secret-2026";

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${validUser}:${validPass}`)
    .digest("hex");

  if (token !== expected) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
