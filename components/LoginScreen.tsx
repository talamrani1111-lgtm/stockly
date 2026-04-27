"use client";
import { useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";

type Props = {
  onLogin: (token: string) => void;
  onRegister: () => void;
  lang: "he" | "en";
};

export default function LoginScreen({ onLogin, onRegister, lang }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRTL = lang === "he";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (lang === "he" ? "שגיאה בכניסה" : "Login failed"));
      } else {
        localStorage.setItem("auth_token", data.token);
        onLogin(data.token);
      }
    } catch {
      setError(lang === "he" ? "שגיאת חיבור" : "Connection error");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.svg" alt="Stockly" className="w-20 h-20 mb-4 drop-shadow-lg" />
          <h1 className="text-white text-2xl font-bold">Stockly</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lang === "he" ? "כניסה לחשבון" : "Sign in to your account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="relative">
            <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none">
              <User size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={lang === "he" ? "שם משתמש" : "Username"}
              autoComplete="username"
              className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-3.5 ps-11 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 transition-colors text-sm"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none">
              <Lock size={16} className="text-gray-500" />
            </div>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={lang === "he" ? "סיסמה" : "Password"}
              autoComplete="current-password"
              className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-3.5 ps-11 pe-12 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 transition-colors text-sm"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute inset-y-0 end-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-brand-red/10 border border-brand-red/20 rounded-xl px-4 py-2.5 text-brand-red text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading || !username || !password}
            className="bg-brand-accent hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-3.5 text-sm font-semibold transition-all shadow-glow mt-1 flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              lang === "he" ? "כניסה" : "Sign In"
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="flex justify-center mt-4">
          <button onClick={onRegister}
            className="text-brand-accent hover:text-blue-400 text-sm transition-colors font-medium">
            {lang === "he" ? "אין לך חשבון? הירשם" : "No account? Register"}
          </button>
        </div>

        {/* Language toggle */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              const newLang = lang === "he" ? "en" : "he";
              localStorage.setItem("app_state", JSON.stringify({
                ...JSON.parse(localStorage.getItem("app_state") ?? "{}"),
                lang: newLang,
              }));
              window.location.reload();
            }}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            {lang === "he" ? "Switch to English" : "עבור לעברית"}
          </button>
        </div>
      </div>
    </div>
  );
}
