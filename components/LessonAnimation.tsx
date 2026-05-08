"use client";

const COLORS = {
  green:  "#22c55e",
  red:    "#ef4444",
  accent: "#3b82f6",
  yellow: "#f59e0b",
  purple: "#8b5cf6",
  gray:   "#374151",
  faint:  "#1f2937",
};

// ─── Individual animation SVGs ──────────────────────────────────────────────

function StockPriceAnim() {
  const points = "15,72 35,60 55,65 75,45 95,48 115,32 135,38 155,20 175,24";
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <line x1="15" y1="80" x2="175" y2="80" stroke={COLORS.gray} strokeWidth="1"/>
      <line x1="15" y1="80" x2="15" y2="10" stroke={COLORS.gray} strokeWidth="1"/>
      {[70,52,34,16].map((y,i) => (
        <line key={i} x1="13" y1={y} x2="175" y2={y} stroke={COLORS.faint} strokeWidth="0.5" strokeDasharray="3,4"/>
      ))}
      <polyline points={points} stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="400" strokeDashoffset="400">
        <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" repeatCount="indefinite"/>
      </polyline>
      <polyline points={points} fill={COLORS.green} fillOpacity="0" stroke="none">
        <animate attributeName="fillOpacity" values="0;0.06;0.06;0" dur="3s" repeatCount="indefinite"/>
      </polyline>
      <circle cx="155" cy="20" r="3" fill={COLORS.green} opacity="0">
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.7;0.8;1;1" dur="3s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

function CandlestickAnim() {
  const candles = [
    { x: 22, o: 65, c: 48, h: 44, l: 70, up: true  },
    { x: 44, o: 55, c: 42, h: 38, l: 58, up: true  },
    { x: 66, o: 45, c: 55, h: 42, l: 60, up: false },
    { x: 88, o: 52, c: 35, h: 30, l: 56, up: true  },
    { x: 110, o: 38, c: 28, h: 23, l: 42, up: true  },
    { x: 132, o: 30, c: 38, h: 27, l: 44, up: false },
    { x: 154, o: 35, c: 22, h: 18, l: 40, up: true  },
  ];
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <line x1="10" y1="80" x2="178" y2="80" stroke={COLORS.gray} strokeWidth="1"/>
      {candles.map((c, i) => {
        const color = c.up ? COLORS.green : COLORS.red;
        const bodyTop = Math.min(c.o, c.c);
        const bodyH = Math.abs(c.o - c.c);
        const delay = `${i * 0.35}s`;
        return (
          <g key={i} opacity="0">
            <animate attributeName="opacity" values="0;1" begin={delay} dur="0.3s" fill="freeze" repeatCount="1"/>
            <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={color} strokeWidth="1.5"/>
            <rect x={c.x - 6} y={bodyTop} width="12" height={Math.max(bodyH, 2)} fill={color} rx="1"/>
          </g>
        );
      })}
    </svg>
  );
}

function PERatioAnim() {
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <text x="10" y="14" fill="#9ca3af" fontSize="8">Value Stock</text>
      <rect x="10" y="18" height="16" rx="3" fill={COLORS.accent} width="0">
        <animate attributeName="width" from="0" to="90" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </rect>
      <text x="108" y="30" fill={COLORS.accent} fontSize="9" fontWeight="bold" opacity="0">
        P/E 15
        <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite"/>
      </text>
      <text x="10" y="54" fill="#9ca3af" fontSize="8">Growth Stock</text>
      <rect x="10" y="58" height="16" rx="3" fill={COLORS.yellow} width="0">
        <animate attributeName="width" from="0" to="148" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </rect>
      <text x="163" y="70" fill={COLORS.yellow} fontSize="9" fontWeight="bold" opacity="0">
        P/E 45
        <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite"/>
      </text>
    </svg>
  );
}

function SupportResistAnim() {
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <line x1="10" y1="22" x2="180" y2="22" stroke={COLORS.red} strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
      <line x1="10" y1="68" x2="180" y2="68" stroke={COLORS.green} strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
      <text x="12" y="18" fill={COLORS.red} fontSize="7.5">Resistance</text>
      <text x="12" y="80" fill={COLORS.green} fontSize="7.5">Support</text>
      <polyline
        points="15,68 30,55 50,35 60,22 75,28 90,50 105,68 120,60 140,40 155,22 165,28 178,45"
        stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="500" strokeDashoffset="500">
        <animate attributeName="stroke-dashoffset" from="500" to="0" dur="4s" repeatCount="indefinite"/>
      </polyline>
    </svg>
  );
}

function DiversificationAnim() {
  const sectors = [
    { label: "Tech",     pct: 30, color: COLORS.accent,  startAngle: -90 },
    { label: "Health",   pct: 25, color: COLORS.green,   startAngle: 18  },
    { label: "Finance",  pct: 22, color: COLORS.yellow,  startAngle: 108 },
    { label: "Energy",   pct: 23, color: COLORS.purple,  startAngle: 187 },
  ];
  const cx = 70, cy = 45, r = 34;
  function arc(start: number, pct: number) {
    const startR = (start * Math.PI) / 180;
    const endR   = ((start + pct * 3.6) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startR), y1 = cy + r * Math.sin(startR);
    const x2 = cx + r * Math.cos(endR),   y2 = cy + r * Math.sin(endR);
    const large = pct > 50 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {sectors.map((s, i) => (
        <path key={i} d={arc(s.startAngle, s.pct)} fill={s.color} opacity="0">
          <animate attributeName="opacity" values="0;0.85" begin={`${i * 0.4}s`} dur="0.4s" fill="freeze" repeatCount="1"/>
        </path>
      ))}
      {sectors.map((s, i) => (
        <text key={i} x="148" y={18 + i * 18} fill={s.color} fontSize="8" opacity="0">
          ■ {s.label} {s.pct}%
          <animate attributeName="opacity" values="0;1" begin={`${i * 0.4}s`} dur="0.3s" fill="freeze" repeatCount="1"/>
        </text>
      ))}
    </svg>
  );
}

function DCAAnim() {
  const wavePts = "10,60 25,50 40,65 55,40 70,55 85,35 100,45 115,30 130,42 145,25 160,35 175,22";
  const buys = [{ x: 10, y: 60 }, { x: 40, y: 65 }, { x: 70, y: 55 }, { x: 100, y: 45 }, { x: 130, y: 42 }, { x: 160, y: 35 }];
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <polyline points={wavePts} stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="500" strokeDashoffset="500">
        <animate attributeName="stroke-dashoffset" from="500" to="0" dur="3s" repeatCount="indefinite"/>
      </polyline>
      {buys.map((b, i) => (
        <g key={i} opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes={`0;${0.1+i*0.14};${0.15+i*0.14};0.9;1`} dur="3s" repeatCount="indefinite"/>
          <circle cx={b.x} cy={b.y} r="4.5" fill={COLORS.green} opacity="0.9"/>
          <text x={b.x} y={b.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6" fontWeight="bold">$</text>
        </g>
      ))}
      <text x="90" y="83" textAnchor="middle" fill={COLORS.green} fontSize="8" opacity="0">
        Average cost lowers over time
        <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.7;1" dur="3s" repeatCount="indefinite"/>
      </text>
    </svg>
  );
}

function ETFBasketAnim() {
  const stocks = [
    { x: 18, y: 30, label: "AAPL", color: COLORS.accent  },
    { x: 55, y: 18, label: "MSFT", color: COLORS.green   },
    { x: 92, y: 28, label: "NVDA", color: COLORS.yellow  },
    { x: 18, y: 60, label: "AMZN", color: COLORS.purple  },
    { x: 55, y: 68, label: "META", color: COLORS.red     },
    { x: 92, y: 58, label: "GOOG", color: "#06b6d4"      },
  ];
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {stocks.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="12" fill={s.color} opacity="0.2"/>
          <text x={s.x} y={s.y + 1} textAnchor="middle" dominantBaseline="middle" fill={s.color} fontSize="6.5" fontWeight="bold">
            {s.label}
          </text>
          <line x1={s.x} y1={s.y} x2="150" y2="44" stroke={s.color} strokeWidth="0.8" opacity="0.4"
            strokeDasharray="60" strokeDashoffset="60">
            <animate attributeName="stroke-dashoffset" from="60" to="0" begin={`${i * 0.25}s`} dur="0.5s" fill="freeze" repeatCount="1"/>
          </line>
        </g>
      ))}
      <rect x="132" y="28" width="36" height="32" rx="6" fill={COLORS.accent} opacity="0.15"/>
      <rect x="132" y="28" width="36" height="32" rx="6" fill="none" stroke={COLORS.accent} strokeWidth="1.5"/>
      <text x="150" y="44" textAnchor="middle" dominantBaseline="middle" fill={COLORS.accent} fontSize="9" fontWeight="bold">ETF</text>
    </svg>
  );
}

function OptionsPLAnim() {
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <line x1="20" y1="55" x2="175" y2="55" stroke={COLORS.gray} strokeWidth="1"/>
      <line x1="20" y1="10" x2="20" y2="80" stroke={COLORS.gray} strokeWidth="1"/>
      <line x1="100" y1="50" x2="100" y2="60" stroke="#9ca3af" strokeWidth="1"/>
      <text x="96" y="72" fill="#9ca3af" fontSize="7">Strike</text>
      <text x="22" y="48" fill={COLORS.red} fontSize="7">Loss</text>
      <text x="22" y="22" fill={COLORS.green} fontSize="7">Profit</text>
      <polyline points="20,70 100,70 175,18"
        stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="300" strokeDashoffset="300">
        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="2.5s" repeatCount="indefinite"/>
      </polyline>
      <polyline points="20,70 100,70" stroke={COLORS.red} strokeWidth="2" opacity="0.4"/>
    </svg>
  );
}

function BetaVolatilityAnim() {
  const marketPts = "15,45 35,48 55,42 75,46 95,43 115,47 135,44 155,46 175,44";
  const highBetaPts = "15,45 35,25 55,65 75,20 95,68 115,22 135,58 155,18 175,55";
  return (
    <svg viewBox="0 0 190 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <polyline points={marketPts} stroke={COLORS.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="300" strokeDashoffset="300">
        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="3s" repeatCount="indefinite"/>
      </polyline>
      <polyline points={highBetaPts} stroke={COLORS.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="500" strokeDashoffset="500">
        <animate attributeName="stroke-dashoffset" from="500" to="0" dur="3s" repeatCount="indefinite"/>
      </polyline>
      <circle cx="12" cy="78" r="3" fill={COLORS.green}/>
      <text x="18" y="81" fill={COLORS.green} fontSize="7">Market (β=1)</text>
      <circle cx="90" cy="78" r="3" fill={COLORS.red}/>
      <text x="96" y="81" fill={COLORS.red} fontSize="7">High Beta (β=2)</text>
    </svg>
  );
}

// ─── Map lesson IDs to animations ────────────────────────────────────────────

const LESSON_ANIM: Record<string, JSX.Element> = {
  "what-is-stock":      <StockPriceAnim />,
  "how-market-works":   <CandlestickAnim />,
  "etf":                <ETFBasketAnim />,
  "pe-ratio":           <PERatioAnim />,
  "earnings":           <CandlestickAnim />,
  "technical":          <SupportResistAnim />,
  "diversification":    <DiversificationAnim />,
  "beta-vix":           <BetaVolatilityAnim />,
  "dollar-cost":        <DCAAnim />,
  "starter-portfolio":  <DiversificationAnim />,
  "mistakes":           <StockPriceAnim />,
  "taxes":              <PERatioAnim />,
  "options-intro":      <OptionsPLAnim />,
  "short-selling":      <SupportResistAnim />,
};

const ANIM_LABELS: Record<string, { he: string; en: string }> = {
  "what-is-stock":     { he: "מחיר מניה עולה עם ביצועי החברה", en: "Stock price rises with company performance" },
  "how-market-works":  { he: "נרות יפניים — כל נר = יום מסחר", en: "Candlesticks — each candle = one trading day" },
  "etf":               { he: "ETF = סל של מניות רבות בקנייה אחת", en: "ETF = many stocks in a single purchase" },
  "pe-ratio":          { he: "P/E גבוה = ציפיות צמיחה גבוהות יותר", en: "Higher P/E = higher growth expectations" },
  "earnings":          { he: "תוצאות רבעוניות מניעות את המחיר", en: "Quarterly results drive the price" },
  "technical":         { he: "מחיר קופץ בין תמיכה להתנגדות", en: "Price bounces between support & resistance" },
  "diversification":   { he: "פיזור בין סקטורים מפחית סיכון", en: "Spreading across sectors reduces risk" },
  "beta-vix":          { he: "Beta גבוה = תנודתיות גבוהה יותר", en: "Higher beta = more volatile price swings" },
  "dollar-cost":       { he: "קנייה קבועה מורידה את המחיר הממוצע", en: "Regular buying lowers your average cost" },
  "starter-portfolio": { he: "תיק מאוזן = פיזור חכם", en: "Balanced portfolio = smart diversification" },
  "options-intro":     { he: "רווח אינסופי, הפסד מוגבל — ב-Call", en: "Unlimited upside, capped loss — on a Call" },
  "short-selling":     { he: "שורט = הימור שהמחיר ירד", en: "Short = betting the price will fall" },
};

// ─── Export ──────────────────────────────────────────────────────────────────

type Props = { lessonId: string; lang: "he" | "en" };

export default function LessonAnimation({ lessonId, lang }: Props) {
  const anim = LESSON_ANIM[lessonId];
  const label = ANIM_LABELS[lessonId];
  if (!anim) return null;

  return (
    <div className="rounded-xl bg-[#0d1117] border border-white/8 overflow-hidden mb-4">
      <div className="h-24 px-3 py-2 flex items-center justify-center">
        {anim}
      </div>
      {label && (
        <div className="px-3 py-1.5 border-t border-white/5 bg-white/3">
          <p className="text-gray-500 text-[10px] text-center">{label[lang]}</p>
        </div>
      )}
    </div>
  );
}
