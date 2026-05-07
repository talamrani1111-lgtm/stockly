"use client";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { BookOpen, ChevronDown, ChevronUp, Star, TrendingUp, Shield, PieChart, Search, CheckCircle } from "lucide-react";

type Lesson = {
  id: string;
  title: { he: string; en: string };
  emoji: string;
  summary: { he: string; en: string };
  points: { he: string; en: string }[];
  glossary?: { term: string; he: string; en: string }[];
};

type Category = {
  id: string;
  title: { he: string; en: string };
  icon: React.ReactNode;
  color: string;
  lessons: Lesson[];
};

const CATEGORIES: Category[] = [
  {
    id: "basics",
    title: { he: "יסודות", en: "Basics" },
    icon: <Star size={16} />,
    color: "text-brand-yellow",
    lessons: [
      {
        id: "what-is-stock",
        emoji: "📈",
        title: { he: "מה זה מניה?", en: "What is a Stock?" },
        summary: {
          he: "מניה היא חלק בבעלות על חברה. כשאתה קונה מניה — אתה הופך לשותף.",
          en: "A stock is a share of ownership in a company. When you buy one, you become a part-owner.",
        },
        points: [
          { he: "מניה = חלק קטן מהבעלות על חברה", en: "A stock = a small slice of company ownership" },
          { he: "כשהחברה מרוויחה, מחיר המניה בדרך כלל עולה", en: "When the company profits, the stock price usually rises" },
          { he: "בעל מניות עשוי לקבל דיבידנד — חלוקת רווחים", en: "Shareholders may receive dividends — a share of profits" },
          { he: "מניות נסחרות בבורסה (NYSE, NASDAQ, ת\"א)", en: "Stocks trade on exchanges (NYSE, NASDAQ, TASE)" },
          { he: "מחיר המניה משתנה לפי היצע וביקוש", en: "Stock price changes based on supply and demand" },
        ],
        glossary: [
          { term: "Dividend", he: "דיבידנד — חלוקת רווחים לבעלי מניות", en: "Dividend — profit distribution to shareholders" },
          { term: "Exchange", he: "בורסה — שוק מרכזי למסחר בניירות ערך", en: "Exchange — a central market for trading securities" },
        ],
      },
      {
        id: "how-market-works",
        emoji: "🏛️",
        title: { he: "איך עובד שוק ההון?", en: "How Does the Market Work?" },
        summary: {
          he: "שוק ההון הוא מקום שבו קונים ומוכרים ניירות ערך. ההיצע והביקוש קובעים את המחיר.",
          en: "The stock market is where buyers and sellers trade securities. Price is set by supply and demand.",
        },
        points: [
          { he: "ה-NYSE וה-NASDAQ הם הבורסות הגדולות בעולם", en: "NYSE and NASDAQ are the world's largest exchanges" },
          { he: "מסחר מתרחש בשעות קבועות: 9:30–16:00 (שעון מזרחי)", en: "Trading happens at set hours: 9:30–4:00 PM ET" },
          { he: "Pre-Market ו-After Hours — מסחר מחוץ לשעות הרגילות, בנפח נמוך", en: "Pre-Market & After Hours — trading outside regular hours, lower volume" },
          { he: "S&P 500 הוא מדד של 500 החברות הגדולות בארה\"ב", en: "S&P 500 is an index of the 500 largest US companies" },
          { he: "Market Makers — גופים שמבטיחים נזילות ושהמסחר יזרום", en: "Market Makers — entities ensuring liquidity and flow of trades" },
        ],
        glossary: [
          { term: "Bull Market", he: "שוק שורי — שוק עולה, אופטימיות", en: "Bull Market — rising market, optimism" },
          { term: "Bear Market", he: "שוק דובי — שוק יורד 20%+ מהשיא", en: "Bear Market — market down 20%+ from peak" },
          { term: "Liquidity", he: "נזילות — קלות המרה של נכס לכסף", en: "Liquidity — ease of converting an asset to cash" },
        ],
      },
      {
        id: "etf",
        emoji: "🧺",
        title: { he: "מה זה ETF?", en: "What is an ETF?" },
        summary: {
          he: "ETF הוא סל מניות שנסחר כמו מניה אחת. דרך נהדרת לפיזור בעלות נמוכה.",
          en: "An ETF is a basket of stocks that trades like a single stock. Great for low-cost diversification.",
        },
        points: [
          { he: "ETF = Exchange Traded Fund = קרן סל", en: "ETF = Exchange Traded Fund" },
          { he: "VOO עוקב אחרי S&P 500 — 500 החברות הגדולות בארה\"ב", en: "VOO tracks the S&P 500 — 500 largest US companies" },
          { he: "QQQ עוקב אחרי NASDAQ 100 — חברות טכנולוגיה", en: "QQQ tracks the NASDAQ 100 — tech-heavy index" },
          { he: "דמי ניהול נמוכים מאוד לעומת קרנות רגילות (0.03%–0.2%)", en: "Very low fees vs. mutual funds (0.03%–0.2%)" },
          { he: "פיזור מיידי — קונה מניה אחת ומפוזר על מאות חברות", en: "Instant diversification — one share spreads across hundreds of companies" },
        ],
        glossary: [
          { term: "Index Fund", he: "קרן מחקה — קרן שעוקבת אחרי מדד", en: "Index Fund — a fund that tracks an index" },
          { term: "Expense Ratio", he: "יחס הוצאות — עלות שנתית של הקרן", en: "Expense Ratio — annual cost of the fund" },
        ],
      },
    ],
  },
  {
    id: "analysis",
    title: { he: "ניתוח מניות", en: "Stock Analysis" },
    icon: <Search size={16} />,
    color: "text-brand-accent",
    lessons: [
      {
        id: "pe-ratio",
        emoji: "🔢",
        title: { he: "P/E Ratio — יחס מחיר לרווח", en: "P/E Ratio — Price to Earnings" },
        summary: {
          he: "P/E הוא אחד המדדים הנפוצים ביותר לבחינת שווי מניה. הוא אומר לך כמה משלמים על כל דולר רווח.",
          en: "P/E is one of the most common valuation metrics. It tells you how much you pay per dollar of earnings.",
        },
        points: [
          { he: "P/E = מחיר המניה / רווח למניה (EPS)", en: "P/E = Stock Price / Earnings Per Share (EPS)" },
          { he: "P/E של 20 = משלמים $20 על כל $1 רווח שנתי", en: "P/E of 20 = paying $20 for every $1 of annual earnings" },
          { he: "P/E גבוה = ציפיות צמיחה גבוהות (למשל NVIDIA)", en: "High P/E = high growth expectations (e.g. NVIDIA)" },
          { he: "P/E נמוך = חברה זולה יחסית, אך לא בהכרח קנייה", en: "Low P/E = relatively cheap, but not necessarily a buy" },
          { he: "הממוצע ההיסטורי של S&P 500 הוא כ-16–18", en: "Historical S&P 500 average P/E is around 16–18" },
          { he: "תמיד השווה P/E לחברות אחרות באותו סקטור", en: "Always compare P/E to peers in the same sector" },
        ],
        glossary: [
          { term: "EPS", he: "רווח למניה — הרווח הנקי חלקי מספר המניות", en: "Earnings Per Share — net income divided by shares outstanding" },
          { term: "Forward P/E", he: "P/E עתידי — לפי תחזית רווחים לשנה הבאה", en: "Forward P/E — based on projected next-year earnings" },
        ],
      },
      {
        id: "earnings",
        emoji: "📊",
        title: { he: "איך לקרוא דוח רווחים?", en: "How to Read an Earnings Report" },
        summary: {
          he: "דוח רווחים הוא הדיווח הרבעוני של חברה על הביצועים שלה. זה האירוע הכי חשוב בחיי מניה.",
          en: "An earnings report is a company's quarterly performance update. It's the most important event in a stock's life.",
        },
        points: [
          { he: "Revenue — הכנסות כוללות (לפני הוצאות)", en: "Revenue — total sales (before expenses)" },
          { he: "EPS (Earnings Per Share) — רווח נקי למניה", en: "EPS — net profit per share" },
          { he: "Beat / Miss — הכה או פספס את תחזיות האנליסטים", en: "Beat / Miss — exceeded or fell short of analyst expectations" },
          { he: "Guidance — תחזית החברה לרבעון הבא, לרוב חשובה יותר מהתוצאות", en: "Guidance — company's forecast for next quarter, often more important than results" },
          { he: "Free Cash Flow — כסף שנשאר אחרי השקעות, מראה בריאות אמיתית", en: "Free Cash Flow — cash left after investments, shows real health" },
          { he: "מניה יכולה לרדת גם אחרי Beat אם ה-Guidance אכזב", en: "A stock can fall even after a beat if guidance disappoints" },
        ],
        glossary: [
          { term: "Consensus", he: "קונסנזוס — ממוצע תחזיות האנליסטים", en: "Consensus — average of analyst forecasts" },
          { term: "Whisper Number", he: "ציפייה לא רשמית — מה השוק באמת מצפה", en: "Whisper Number — unofficial expectation, what market truly expects" },
        ],
      },
      {
        id: "technical",
        emoji: "📉",
        title: { he: "ניתוח טכני בסיסי", en: "Basic Technical Analysis" },
        summary: {
          he: "ניתוח טכני הוא קריאת גרפים כדי לזהות דפוסים ומגמות. כלי עזר, לא נבואה.",
          en: "Technical analysis is reading charts to identify patterns and trends. A tool, not a crystal ball.",
        },
        points: [
          { he: "Support — רצפת מחיר שהמניה קפצה ממנה בעבר", en: "Support — price floor the stock bounced from before" },
          { he: "Resistance — תקרת מחיר שהמניה לא הצליחה לפרוץ", en: "Resistance — price ceiling the stock struggled to break" },
          { he: "Moving Average (MA) — ממוצע מחיר לתקופה (50/200 ימים)", en: "Moving Average (MA) — average price over a period (50/200 days)" },
          { he: "RSI — מדד כוח יחסי. מעל 70 = אולי קנוי יתר, מתחת 30 = אולי מכור יתר", en: "RSI — Relative Strength Index. Above 70 = overbought, below 30 = oversold" },
          { he: "Volume — נפח מסחר. פריצה עם נפח גבוה = אמינה יותר", en: "Volume — trading volume. A breakout on high volume = more reliable" },
        ],
        glossary: [
          { term: "Breakout", he: "פריצה — מחיר שפורץ מעל תקרת התנגדות", en: "Breakout — price breaking above resistance" },
          { term: "Trend", he: "מגמה — כיוון כללי של המחיר לאורך זמן", en: "Trend — general direction of price over time" },
        ],
      },
    ],
  },
  {
    id: "risk",
    title: { he: "ניהול סיכון", en: "Risk Management" },
    icon: <Shield size={16} />,
    color: "text-brand-green",
    lessons: [
      {
        id: "diversification",
        emoji: "🌍",
        title: { he: "פיזור — הכלי הכי חשוב", en: "Diversification — The Most Important Tool" },
        summary: {
          he: "פיזור הוא חלוקת ההשקעות כך שאף מניה אחת לא תוכל לפגוע קשות בתיק.",
          en: "Diversification means spreading investments so no single stock can badly hurt your portfolio.",
        },
        points: [
          { he: "אל תשקיע יותר מ-5–10% בחברה אחת", en: "Don't invest more than 5–10% in any single company" },
          { he: "פזר בין סקטורים: טכנולוגיה, בריאות, פיננסים, אנרגיה", en: "Spread across sectors: tech, healthcare, finance, energy" },
          { he: "פזר בין מדינות: ארה\"ב, אירופה, אסיה, ישראל", en: "Spread across countries: US, Europe, Asia, Israel" },
          { he: "ETF הוא הדרך הקלה ביותר לפיזור מיידי", en: "ETF is the easiest way to instant diversification" },
          { he: "Correlation — מניות שזזות ביחד = פיזור נמוך", en: "Correlation — stocks that move together = low diversification" },
        ],
        glossary: [
          { term: "Correlation", he: "מתאם — כמה שני נכסים זזים יחד", en: "Correlation — how much two assets move together" },
          { term: "Sector", he: "סקטור — קבוצת חברות באותו ענף", en: "Sector — group of companies in the same industry" },
        ],
      },
      {
        id: "beta-vix",
        emoji: "⚡",
        title: { he: "Beta ו-VIX — מדדי תנודתיות", en: "Beta & VIX — Volatility Metrics" },
        summary: {
          he: "Beta מודד כמה מניה תנודתית ביחס לשוק. VIX מודד את הפחד בשוק כולו.",
          en: "Beta measures how volatile a stock is vs. the market. VIX measures market-wide fear.",
        },
        points: [
          { he: "Beta 1.0 = זזה בדיוק כמו השוק", en: "Beta 1.0 = moves exactly like the market" },
          { he: "Beta 1.5 = זזה 50% יותר מהשוק (עלייה וירידה)", en: "Beta 1.5 = moves 50% more than the market (up and down)" },
          { he: "Beta נמוך מ-1 = מניות דפנסיביות (חשמל, בריאות)", en: "Beta below 1 = defensive stocks (utilities, healthcare)" },
          { he: "VIX מתחת 20 = שוק רגוע, VIX מעל 30 = פחד גבוה", en: "VIX below 20 = calm market, VIX above 30 = high fear" },
          { he: "VIX גבוה = לרוב הזדמנויות קנייה לטווח ארוך", en: "High VIX = often long-term buying opportunities" },
        ],
        glossary: [
          { term: "Volatility", he: "תנודתיות — כמה מחיר המניה משתנה", en: "Volatility — how much a stock's price fluctuates" },
          { term: "VIX", he: "מדד הפחד — מדד תנודתיות ה-S&P 500 ל-30 יום", en: "VIX — S&P 500 30-day implied volatility index" },
        ],
      },
      {
        id: "dollar-cost",
        emoji: "📅",
        title: { he: "Dollar Cost Averaging — השקעה קבועה", en: "Dollar Cost Averaging" },
        summary: {
          he: "השקעה של סכום קבוע כל חודש — ללא קשר למחיר. אחת האסטרטגיות הכי יעילות למתחילים.",
          en: "Investing a fixed amount monthly, regardless of price. One of the most effective beginner strategies.",
        },
        points: [
          { he: "השקעת $500/חודש בכל מצב — עולה או יורד", en: "Invest $500/month regardless of market conditions" },
          { he: "כשהשוק יורד — קונה יותר מניות באותו כסף", en: "When market falls — you buy more shares for the same money" },
          { he: "מפחית את הסיכון של 'לקנות בשיא'", en: "Reduces the risk of 'buying at the top'" },
          { he: "מתאים במיוחד ל-ETF על מדדים רחבים", en: "Especially suited for broad-index ETFs" },
          { he: "עדיף לעשות זאת דרך Automatic Investment Plan", en: "Best done through an Automatic Investment Plan" },
        ],
      },
    ],
  },
  {
    id: "portfolio",
    title: { he: "בניית תיק", en: "Building a Portfolio" },
    icon: <PieChart size={16} />,
    color: "text-purple-400",
    lessons: [
      {
        id: "starter-portfolio",
        emoji: "🚀",
        title: { he: "תיק מתחיל — איפה להתחיל?", en: "Starter Portfolio — Where to Begin?" },
        summary: {
          he: "תיק פשוט של מתחיל: 3 ETF מגוונים. פשוט, זול, ויעיל.",
          en: "A simple beginner portfolio: 3 diversified ETFs. Simple, cheap, and effective.",
        },
        points: [
          { he: "60% VOO — S&P 500 (ארה\"ב)", en: "60% VOO — S&P 500 (US large cap)" },
          { he: "20% QQQ — NASDAQ 100 (טכנולוגיה)", en: "20% QQQ — NASDAQ 100 (tech)" },
          { he: "20% VEA / VXUS — שווקים בינלאומיים", en: "20% VEA / VXUS — international markets" },
          { he: "הוסף בדרגתיות מניות בודדות כשצברת ניסיון", en: "Gradually add individual stocks as you gain experience" },
          { he: "שמור 3–6 חודשי הוצאות במזומן לפני שאתה משקיע", en: "Keep 3–6 months expenses in cash before investing" },
        ],
        glossary: [
          { term: "Asset Allocation", he: "הקצאת נכסים — פיזור בין סוגי נכסים שונים", en: "Asset Allocation — spreading between asset types" },
          { term: "Rebalancing", he: "ריבלנסינג — איפוס ההקצאה לאחוזים המקוריים", en: "Rebalancing — resetting allocation to original percentages" },
        ],
      },
      {
        id: "mistakes",
        emoji: "⚠️",
        title: { he: "5 טעויות נפוצות של מתחילים", en: "5 Common Beginner Mistakes" },
        summary: {
          he: "למד מהטעויות של אחרים. כולם עשו אותן — לא חייבים.",
          en: "Learn from others' mistakes. Everyone made these — you don't have to.",
        },
        points: [
          { he: "1. לקנות מניה כי 'כולם מדברים עליה' (FOMO)", en: "1. Buying because 'everyone's talking about it' (FOMO)" },
          { he: "2. לבדוק את המחירים עשרות פעמים ביום — גורם להחלטות רגשיות", en: "2. Checking prices dozens of times daily — leads to emotional decisions" },
          { he: "3. למכור בפאניקה כשהשוק יורד — בדיוק ההפך ממה שצריך", en: "3. Panic selling when the market drops — exactly the wrong move" },
          { he: "4. לא לפזר — להשקיע הכל במניה אחת", en: "4. No diversification — putting everything in one stock" },
          { he: "5. לנסות לתזמן את השוק — גם המקצוענים לא מצליחים", en: "5. Trying to time the market — even pros fail at this" },
        ],
      },
      {
        id: "taxes",
        emoji: "🧾",
        title: { he: "מס רווחי הון בישראל", en: "Capital Gains Tax in Israel" },
        summary: {
          he: "בישראל יש מס של 25% על רווחי הון. כדאי להכיר את הכללים לפני שמוכרים.",
          en: "In Israel, capital gains tax is 25%. Know the rules before you sell.",
        },
        points: [
          { he: "25% מס על רווח הון ריאלי (מעל האינפלציה)", en: "25% tax on real capital gains (above inflation)" },
          { he: "הפסדים ניתנים לקיזוז מרווחים באותה שנה", en: "Losses can offset gains in the same tax year" },
          { he: "דיבידנד מחו\"ל: 25% (בדרך כלל מנוכה במקור בארה\"ב — 15%)", en: "Foreign dividends: 25% (usually 15% withheld in US)" },
          { he: "חשבון IRA / קופת גמל להשקעה — פטורה ממס עד משיכה", en: "IRA / Kuppat Gemel — tax-deferred until withdrawal" },
          { he: "יש לדווח למס הכנסה על רווחי הון מחו\"ל", en: "Must report foreign capital gains to tax authority" },
        ],
        glossary: [
          { term: "IRA", he: "חשבון פנסיה אמריקאי — נדחה מס", en: "Individual Retirement Account — tax-deferred" },
          { term: "Tax-Loss Harvesting", he: "מכירה של מניות בהפסד כדי להפחית מס", en: "Selling losing positions to reduce tax burden" },
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: { he: "מתקדמים", en: "Advanced" },
    icon: <TrendingUp size={16} />,
    color: "text-brand-red",
    lessons: [
      {
        id: "options-intro",
        emoji: "🎯",
        title: { he: "אופציות — מבוא בסיסי", en: "Options — Basic Introduction" },
        summary: {
          he: "אופציה היא חוזה לקנייה/מכירה של מניה במחיר קבוע. כלי עוצמתי — ומסוכן.",
          en: "An option is a contract to buy/sell a stock at a fixed price. Powerful — and risky.",
        },
        points: [
          { he: "Call Option = זכות לקנות מניה במחיר מוסכם (Strike)", en: "Call Option = right to buy stock at agreed price (Strike)" },
          { he: "Put Option = זכות למכור מניה במחיר מוסכם", en: "Put Option = right to sell stock at agreed price" },
          { he: "Expiration — כל אופציה פוקעת בתאריך מסוים", en: "Expiration — every option expires on a set date" },
          { he: "Premium — המחיר ששלמת עבור האופציה", en: "Premium — the price you paid for the option" },
          { he: "אופציות יכולות לפוג ב-0 — אפשר להפסיד 100% מההשקעה", en: "Options can expire worthless — you can lose 100%" },
          { he: "מתאים רק לאחר שהבנת לעומק את שוק המניות הרגיל", en: "Only suitable after deeply understanding regular stocks" },
        ],
        glossary: [
          { term: "Strike Price", he: "מחיר המימוש — המחיר שבו ניתן לממש את האופציה", en: "Strike Price — the price at which the option can be exercised" },
          { term: "ITM/OTM", he: "In/Out of the Money — האם האופציה רווחית לממש", en: "In/Out of the Money — whether it's profitable to exercise" },
        ],
      },
      {
        id: "short-selling",
        emoji: "📉",
        title: { he: "Short Selling — מכירה בחסר", en: "Short Selling" },
        summary: {
          he: "Short Selling הוא הימור שמניה תרד. תחילה מוכרים מניות שלוות, אחר כך קונים בחזרה בזול.",
          en: "Short Selling is a bet that a stock will fall. You borrow shares to sell, then buy back cheaper.",
        },
        points: [
          { he: "לווה מניות מהברוקר ומוכר אותן בשוק", en: "Borrow shares from broker and sell them in the market" },
          { he: "אם המחיר יורד — קונה בחזרה בזול ומחזיר, מרוויח את ההפרש", en: "If price falls — buy back cheaper, return shares, keep difference" },
          { he: "אם המחיר עולה — מפסיד ואין תקרה להפסד", en: "If price rises — loss is potentially unlimited" },
          { he: "Short Squeeze — קפיצת מחיר שמכריחה שורטיסטים לקנות", en: "Short Squeeze — price spike forcing short sellers to buy" },
          { he: "מתאים רק לסוחרים מנוסים עם הבנה מעמיקה", en: "Only for experienced traders with deep understanding" },
        ],
        glossary: [
          { term: "Short Squeeze", he: "לחיצת שורט — עלייה חדה שמכריחה מכירות בחסר להיסגר", en: "Short Squeeze — rapid price rise forcing short sellers to close" },
          { term: "Short Interest", he: "אחוז מניות המניה שמוחזקות בשורט", en: "Percentage of shares held short" },
        ],
      },
    ],
  },
];

export default function LearnTab() {
  const { lang, isRTL } = useApp();
  const [activeCategory, setActiveCategory] = useState("basics");
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("learn_completed");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  function toggleComplete(id: string) {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompleted(next);
    try { localStorage.setItem("learn_completed", JSON.stringify([...next])); } catch {}
  }

  const category = CATEGORIES.find(c => c.id === activeCategory)!;
  const totalLessons = CATEGORIES.reduce((s, c) => s + c.lessons.length, 0);
  const completedCount = completed.size;
  const progress = Math.round((completedCount / totalLessons) * 100);

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-accent/20 flex items-center justify-center">
          <BookOpen size={20} className="text-brand-accent" />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold text-sm">
            {lang === "he" ? "מדריך שוק ההון" : "Stock Market Guide"}
          </h2>
          <p className="text-gray-500 text-xs">
            {lang === "he" ? `${completedCount} / ${totalLessons} שיעורים` : `${completedCount} / ${totalLessons} lessons`}
          </p>
        </div>
        <div className="text-brand-accent font-bold text-sm">{progress}%</div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/8 rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-brand-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4 pb-1">
        {CATEGORIES.map(cat => {
          const catCompleted = cat.lessons.filter(l => completed.has(l.id)).length;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-brand-surface border border-brand-accent/40 text-white"
                  : "bg-white/5 text-gray-500 hover:text-gray-300"
              }`}>
              <span className={cat.color}>{cat.icon}</span>
              {cat.title[lang]}
              {catCompleted > 0 && (
                <span className="bg-brand-accent/20 text-brand-accent text-[9px] px-1.5 rounded-full">
                  {catCompleted}/{cat.lessons.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {category.lessons.map(lesson => {
          const isOpen = openLesson === lesson.id;
          const isDone = completed.has(lesson.id);

          return (
            <div key={lesson.id}
              className={`bg-brand-card border rounded-2xl overflow-hidden transition-all ${isDone ? "border-brand-green/30" : "border-brand-border"}`}>
              <button className="w-full flex items-center gap-3 p-4 text-start"
                onClick={() => setOpenLesson(isOpen ? null : lesson.id)}>
                <span className="text-2xl flex-shrink-0">{lesson.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isDone ? "text-gray-400" : "text-white"}`}>
                    {lesson.title[lang]}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed line-clamp-2">
                    {lesson.summary[lang]}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDone && <CheckCircle size={16} className="text-brand-green" />}
                  {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-brand-border">
                  {/* Key points */}
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mt-4 mb-2">
                    {lang === "he" ? "נקודות מפתח" : "Key Points"}
                  </p>
                  <ul className="space-y-2">
                    {lesson.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-brand-accent text-xs mt-0.5 flex-shrink-0">▸</span>
                        <span className="text-gray-300 text-sm leading-relaxed">{point[lang]}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Glossary */}
                  {lesson.glossary && lesson.glossary.length > 0 && (
                    <>
                      <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mt-5 mb-2">
                        {lang === "he" ? "מושגים" : "Glossary"}
                      </p>
                      <div className="space-y-2">
                        {lesson.glossary.map((g) => (
                          <div key={g.term} className="bg-brand-surface rounded-xl px-3 py-2">
                            <span className="text-brand-accent text-xs font-bold">{g.term} </span>
                            <span className="text-gray-400 text-xs">{g[lang]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Mark complete button */}
                  <button onClick={() => toggleComplete(lesson.id)}
                    className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                      isDone
                        ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                        : "bg-brand-accent/10 text-brand-accent border border-brand-accent/20 hover:bg-brand-accent/20"
                    }`}>
                    <CheckCircle size={15} />
                    {isDone
                      ? (lang === "he" ? "✓ הושלם" : "✓ Completed")
                      : (lang === "he" ? "סמן כהושלם" : "Mark as Complete")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
