import { NextRequest, NextResponse } from "next/server";
import { createUser, findUser, findUserByEmail, createVerificationCode, markEmailVerified, makeToken } from "@/lib/users";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { username, password, email, phone } = await req.json();

  if (!username || !password || !email) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "סיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
  }
  if (await findUser(username)) {
    return NextResponse.json({ error: "שם המשתמש כבר קיים" }, { status: 409 });
  }
  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "האימייל כבר רשום" }, { status: 409 });
  }

  const user = await createUser(username, password, email, phone);

  // Try to send verification email
  let emailSent = false;
  try {
    const code = await createVerificationCode(user.id, "email");
    await sendVerificationEmail(email, code);
    emailSent = true;
  } catch {
    // SMTP not configured — auto-verify so user can login immediately
  }

  if (!emailSent) {
    await markEmailVerified(user.id);
    const token = makeToken(user.id);
    return NextResponse.json({ userId: user.id, emailSent: false, token });
  }

  return NextResponse.json({ userId: user.id, emailSent: true });
}
