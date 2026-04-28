import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/users";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ valid: false });
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, username: user.username, role: user.role, emailVerified: user.emailVerified });
}
