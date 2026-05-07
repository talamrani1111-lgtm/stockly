"use client";
import { useEffect, useState } from "react";

export default function FixPage() {
  const [status, setStatus] = useState("מתחיל תיקון...");
  const [details, setDetails] = useState("");

  useEffect(() => {
    async function fix() {
      try {
        const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

        // Fix server-side data if authenticated
        if (token) {
          setStatus("מושך נתונים מהשרת...");
          const res = await fetch("/api/portfolio", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const serverPortfolio = await res.json();
          setDetails(`נמצאו ${Array.isArray(serverPortfolio) ? serverPortfolio.length : 0} פוזיציות`);

          if (Array.isArray(serverPortfolio)) {
            const fixed = serverPortfolio.map((p: { symbol: string; shares: number; avgPrice: number; currency?: string; manualPrice?: number }) => {
              if (p.symbol === "TA-125") {
                const shares = p.shares || 396;
                const avgPrice = 6128 / shares;
                return { ...p, shares, avgPrice, manualPrice: avgPrice, currency: "ILS" };
              }
              return p;
            });

            setStatus("שומר נתונים מתוקנים לשרת...");
            await fetch("/api/portfolio", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(fixed),
            });
          }
        }

        // Fix localStorage
        setStatus("מתקן נתונים מקומיים...");
        const raw = localStorage.getItem("app_state");
        if (raw) {
          const state = JSON.parse(raw);
          const portfolio = state.portfolio ?? [];
          const fixed = portfolio.map((p: { symbol: string; shares: number; avgPrice: number; currency?: string; manualPrice?: number }) => {
            if (p.symbol === "TA-125") {
              const shares = p.shares || 396;
              const avgPrice = 6128 / shares;
              return { ...p, shares, avgPrice, manualPrice: avgPrice, currency: "ILS" };
            }
            return p;
          });
          localStorage.setItem("app_state", JSON.stringify({ ...state, portfolio: fixed }));
        }

        setStatus("✅ תוקן! חוזר לאפליקציה...");
        setTimeout(() => { window.location.href = "/"; }, 1500);
      } catch (e) {
        setStatus("❌ שגיאה: " + String(e));
      }
    }
    fix();
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#090c14", color: "white",
      fontFamily: "sans-serif", gap: 12, direction: "rtl", padding: 24,
    }}>
      <div style={{ fontSize: 48 }}>{status.startsWith("✅") ? "✅" : status.startsWith("❌") ? "❌" : "⏳"}</div>
      <p style={{ fontSize: 18, fontWeight: "bold", textAlign: "center" }}>{status}</p>
      {details && <p style={{ color: "#6b7280", fontSize: 13 }}>{details}</p>}
      <p style={{ color: "#374151", fontSize: 12, marginTop: 8 }}>TA-125 · 396 יחידות · ₪15.47 ליחידה</p>
    </div>
  );
}
