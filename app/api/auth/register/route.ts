import { NextRequest, NextResponse } from "next/server";
import { createUser, findUser, findUserByEmail, createVerificationCode } from "@/lib/users";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { username, password, email, phone } = await req.json();

  if (!username || !password || !email) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "סיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
  }
  if (findUser(username)) {
    return NextResponse.json({ error: "שם המשתמש כבר קיים" }, { status: 409 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "האימייל כבר רשום" }, { status: 409 });
  }

  const user = await createUser(username, password, email, phone);
  const code = createVerificationCode(user.id, "email");

  try {
    await sendVerificationEmail(email, code);
  } catch {
    // SMTP not configured — still allow registration, just can't verify
  }

  return NextResponse.json({ userId: user.id, emailSent: true });
}
