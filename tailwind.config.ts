import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#090c14",
          surface: "#0f1320",
          card: "#131720",
          border: "rgba(255,255,255,0.08)",
          accent: "#3b82f6",
          accentDark: "#1d4ed8",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#f59e0b",
          purple: "#a855f7",
        },
      },
      backgroundImage: {
        "card-gradient": "linear-gradient(135deg, #131720 0%, #0f1320 100%)",
        "green-gradient": "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.05) 100%)",
        "red-gradient": "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.05) 100%)",
        "blue-gradient": "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(29,78,216,0.05) 100%)",
        "header-gradient": "linear-gradient(180deg, #0f1320 0%, rgba(9,12,20,0) 100%)",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(59,130,246,0.3)",
        "glow-green": "0 0 20px rgba(34,197,94,0.2)",
        "glow-red": "0 0 20px rgba(239,68,68,0.2)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        ticker: "ticker 40s linear infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
