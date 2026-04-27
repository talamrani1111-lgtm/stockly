"use client";
import { useState } from "react";
import { Eye, EyeOff, Lock, User, Mail, Phone, ArrowLeft, CheckCircle } from "lucide-react";

type Props = { lang: "he" | "en"; onBack: () => void; onRegistered: () => void };
type Step = "form" | "verify";

export default function RegisterScreen({ lang, onBack, onRegistered }: Props) {
  const isRTL = lang === "he";
  const [step, setStep] = useState<Step>("form");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setUserId(data.userId);
      setEmailSent(data.emailSent);
      setStep("verify");
    } catch { setError(isRTL ? "שגיאת חיבור" : "Connection error"); }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      localStorage.setItem("auth_token", data.token);
      onRegistered();
    } catch { setError(isRTL ? "שגיאת חיבור" : "Connection error"); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
          {isRTL ? "חזור לכניסה" : "Back to login"}
        </button>

        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="Stockly" className="w-16 h-16 mb-4 drop-shadow-lg" />
          <h1 className="text-white text-xl font-bold">
            {step === "form" ? (isRTL ? "יצירת חשבון" : "Create Account") : (isRTL ? "אימות אימייל" : "Verify Email")}
          </h1>
          {step === "verify" && (
            <p className="text-gray-500 text-sm mt-1 text-center">
              {emailSent
                ? (isRTL ? `שלחנו קוד ל-${email}` : `We sent a code to ${email}`)
                : (isRTL ? "SMTP לא מוגדר — הכנס קוד מהשרת" : "SMTP not configured — get code from server logs")}
            </p>
          )}
        </div>

        {step === "form" ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="relative">
              <User size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                placeholder={isRTL ? "שם משתמש" : "Username"}
                className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-3.5 ps-11 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 text-sm" />
            </div>
            <div className="relative">
              <Mail size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder={isRTL ? "אימייל" : "Email"}
                className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-3.5 ps-11 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 text-sm" />
            </div>
            <div className="relative">
              <Phone size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder={isRTL ? "טלפון (אופציונלי)" : "Phone (optional)"}
                className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-3.5 ps-11 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 text-sm" />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder={isRTL ? "סיסמה (מינימום 6 תווים)" : "Password (min 6 chars)"}
                className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-3.5 ps-11 pe-12 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 text-sm" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 end-4 flex items-center text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <div className="bg-brand-red/10 border border-brand-red/20 rounded-xl px-4 py-2.5 text-brand-red text-sm text-center">{error}</div>}
            <button type="submit" disabled={loading}
              className="bg-brand-accent hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-3.5 text-sm font-semibold mt-1 flex items-center justify-center gap-2 shadow-glow">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isRTL ? "צור חשבון" : "Create Account")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-4 text-center mb-2">
              <CheckCircle size={20} className="text-brand-accent mx-auto mb-2" />
              <p className="text-white text-sm font-medium">{isRTL ? "בדוק את תיבת הדואר שלך" : "Check your inbox"}</p>
            </div>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required
              placeholder={isRTL ? "קוד בן 6 ספרות" : "6-digit code"}
              className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-4 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder-gray-700 focus:outline-none focus:border-brand-accent/50" />
            {error && <div className="bg-brand-red/10 border border-brand-red/20 rounded-xl px-4 py-2.5 text-brand-red text-sm text-center">{error}</div>}
            <button type="submit" disabled={loading || code.length < 6}
              className="bg-brand-accent hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-glow">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isRTL ? "אמת ✓" : "Verify ✓")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
