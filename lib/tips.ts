export const tips = [
  {
    en: "\"The stock market is a device for transferring money from the impatient to the patient.\" — Warren Buffett",
    he: "\"שוק המניות הוא מכשיר להעברת כסף מחסרי הסבלנות לסבלניים.\" — וורן באפט",
  },
  {
    en: "Diversification is the only free lunch in investing. Don't put all your eggs in one basket.",
    he: "פיזור הוא ארוחת החינם היחידה בהשקעות. אל תשים את כל הביצים בסל אחד.",
  },
  {
    en: "\"In the short run, the market is a voting machine. In the long run, it's a weighing machine.\" — Benjamin Graham",
    he: "\"בטווח הקצר השוק הוא מכונת הצבעה. בטווח הארוך הוא מכונת שקילה.\" — בנג'מין גראהם",
  },
  {
    en: "Time in the market beats timing the market. Stay invested, stay patient.",
    he: "זמן בשוק עדיף על תזמון השוק. הישאר מושקע, הישאר סבלני.",
  },
  {
    en: "\"Risk comes from not knowing what you're doing.\" — Warren Buffett",
    he: "\"סיכון נובע מאי ידיעה מה אתה עושה.\" — וורן באפט",
  },
  {
    en: "Keep investment costs low — fees compound just like returns, but against you.",
    he: "שמור על עלויות השקעה נמוכות — דמי ניהול מצטברים בדיוק כמו תשואות, רק נגדך.",
  },
  {
    en: "\"The four most dangerous words in investing: 'This time it's different.'\" — John Templeton",
    he: "\"ארבע המילים המסוכנות ביותר בהשקעות: 'הפעם זה שונה.'\" — ג'ון טמפלטון",
  },
  {
    en: "Don't invest money you might need in the next 1–3 years. Markets can take time to recover.",
    he: "אל תשקיע כסף שתצטרך ב-1–3 השנים הקרובות. לשווקים לוקח זמן להתאושש.",
  },
  {
    en: "Volatility is the price of admission for long-term market gains. Embrace it.",
    he: "תנודתיות היא מחיר הכניסה לרווחי שוק לטווח ארוך. קבל אותה.",
  },
  {
    en: "\"Be fearful when others are greedy, and greedy when others are fearful.\" — Warren Buffett",
    he: "\"היה פחדן כשאחרים חומדנים, וחמדן כשאחרים פחדנים.\" — וורן באפט",
  },
  {
    en: "Dollar-cost averaging removes emotion from investing. Invest a fixed amount regularly.",
    he: "השקעה בסכום קבוע מדי חודש מסירה רגש מהמשוואה. השקע סכום קבוע בקביעות.",
  },
  {
    en: "Check your portfolio less often. Frequent checking leads to emotional decisions.",
    he: "בדוק את התיק שלך פחות לעיתים קרובות. בדיקה תכופה מובילה להחלטות רגשיות.",
  },
  {
    en: "High returns and low risk don't coexist. If something sounds too good — it probably is.",
    he: "תשואות גבוהות וסיכון נמוך לא קיימים יחד. אם משהו נשמע טוב מדי — כנראה שהוא כזה.",
  },
  {
    en: "Index funds outperform most active fund managers over 10+ years. Simple wins.",
    he: "קרנות מחקות מכות את רוב המנהלים הפעילים על פני 10+ שנים. הפשטות מנצחת.",
  },
];

export function getDailyTip(lang: "he" | "en"): string {
  const day = new Date().getDay() + new Date().getDate();
  const tip = tips[day % tips.length];
  return tip[lang];
}
