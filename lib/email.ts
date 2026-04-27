import nodemailer from "nodemailer";

export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, code: string, lang: "he" | "en" = "he") {
  const transporter = getTransporter();
  if (!transporter) throw new Error("SMTP not configured");

  const subject = lang === "he" ? "קוד אימות - Stockly" : "Verification Code - Stockly";
  const body = lang === "he"
    ? `קוד האימות שלך הוא: <strong style="font-size:28px;letter-spacing:4px">${code}</strong><br><br>הקוד תקף ל-15 דקות.`
    : `Your verification code is: <strong style="font-size:28px;letter-spacing:4px">${code}</strong><br><br>Valid for 15 minutes.`;

  await transporter.sendMail({
    from: `"Stockly" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#090c14;color:#fff;border-radius:16px">
        <h2 style="color:#3b82f6;margin-bottom:24px">Stockly</h2>
        <p style="color:#9ca3af;margin-bottom:16px">${body}</p>
        <p style="color:#4b5563;font-size:12px">אם לא ביקשת קוד זה, התעלם מהודעה זו.</p>
      </div>`,
  });
}

export async function sendMorningSummaryEmail(to: string, content: string) {
  const transporter = getTransporter();
  if (!transporter) throw new Error("SMTP not configured");

  await transporter.sendMail({
    from: `"Stockly" <${process.env.SMTP_USER}>`,
    to,
    subject: `📈 Stockly - סיכום בוקר ${new Date().toLocaleDateString("he-IL")}`,
    html: content,
  });
}
