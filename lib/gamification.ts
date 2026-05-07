export type Badge = {
  id: string;
  emoji: string;
  name: { he: string; en: string };
  desc: { he: string; en: string };
  earned: boolean;
  earnedAt?: number;
};

const BADGE_DEFS: Omit<Badge, "earned" | "earnedAt">[] = [
  { id: "first_stock",   emoji: "🌱", name: { he: "משקיע ראשון", en: "First Investor" },      desc: { he: "הוספת מניה ראשונה לתיק", en: "Added your first stock" } },
  { id: "streak_3",      emoji: "🔥", name: { he: "3 ימים רצופים", en: "3-Day Streak" },       desc: { he: "נכנסת 3 ימים ברצף", en: "Checked in 3 days in a row" } },
  { id: "streak_7",      emoji: "⚡", name: { he: "שבוע רצוף", en: "Week Streak" },            desc: { he: "נכנסת 7 ימים ברצף", en: "Checked in 7 days in a row" } },
  { id: "streak_30",     emoji: "👑", name: { he: "חודש רצוף", en: "Month Streak" },           desc: { he: "נכנסת 30 ימים ברצף", en: "Checked in 30 days in a row" } },
  { id: "milestone_10k", emoji: "💰", name: { he: "תיק $10K", en: "$10K Portfolio" },         desc: { he: "התיק שלך עבר $10,000", en: "Your portfolio crossed $10,000" } },
  { id: "milestone_50k", emoji: "🚀", name: { he: "תיק $50K", en: "$50K Portfolio" },         desc: { he: "התיק שלך עבר $50,000", en: "Your portfolio crossed $50,000" } },
  { id: "diversified",   emoji: "🌍", name: { he: "מפוזר", en: "Diversified" },               desc: { he: "5+ מניות שונות בתיק", en: "5+ different stocks in portfolio" } },
  { id: "scholar",       emoji: "📚", name: { he: "חכם שוק", en: "Market Scholar" },          desc: { he: "השלמת 5 שיעורים", en: "Completed 5 lessons" } },
  { id: "alert_set",     emoji: "🎯", name: { he: "צייד מחירים", en: "Price Hunter" },        desc: { he: "הגדרת התראת מחיר", en: "Set a price alert" } },
  { id: "all_time_high", emoji: "🏆", name: { he: "שיא חדש!", en: "All-Time High!" },         desc: { he: "התיק שלך הגיע לשיא", en: "Your portfolio hit a new high" } },
  { id: "profit_10pct",  emoji: "📈", name: { he: "עלייה של 10%", en: "+10% Return" },        desc: { he: "התיק עלה 10% מאז הקנייה", en: "Portfolio up 10% since purchase" } },
];

function load(): Badge[] {
  try {
    const raw = localStorage.getItem("badges");
    const saved: Record<string, { earned: boolean; earnedAt?: number }> = raw ? JSON.parse(raw) : {};
    return BADGE_DEFS.map(def => ({
      ...def,
      earned: saved[def.id]?.earned ?? false,
      earnedAt: saved[def.id]?.earnedAt,
    }));
  } catch { return BADGE_DEFS.map(d => ({ ...d, earned: false })); }
}

function save(badges: Badge[]) {
  try {
    const map: Record<string, { earned: boolean; earnedAt?: number }> = {};
    badges.forEach(b => { map[b.id] = { earned: b.earned, earnedAt: b.earnedAt }; });
    localStorage.setItem("badges", JSON.stringify(map));
  } catch {}
}

export function getBadges(): Badge[] { return load(); }

export function awardBadge(id: string): Badge | null {
  const badges = load();
  const badge = badges.find(b => b.id === id);
  if (!badge || badge.earned) return null;
  badge.earned = true;
  badge.earnedAt = Date.now();
  save(badges);
  return badge;
}

export function checkAndAward(conditions: {
  portfolioSize?: number;
  portfolioValue?: number;
  portfolioReturn?: number;
  isAllTimeHigh?: boolean;
  lessonsCompleted?: number;
  alertSet?: boolean;
}): Badge[] {
  const newlyEarned: Badge[] = [];

  if (conditions.portfolioSize && conditions.portfolioSize >= 1) {
    const b = awardBadge("first_stock"); if (b) newlyEarned.push(b);
  }
  if (conditions.portfolioSize && conditions.portfolioSize >= 5) {
    const b = awardBadge("diversified"); if (b) newlyEarned.push(b);
  }
  if (conditions.portfolioValue && conditions.portfolioValue >= 10000) {
    const b = awardBadge("milestone_10k"); if (b) newlyEarned.push(b);
  }
  if (conditions.portfolioValue && conditions.portfolioValue >= 50000) {
    const b = awardBadge("milestone_50k"); if (b) newlyEarned.push(b);
  }
  if (conditions.portfolioReturn && conditions.portfolioReturn >= 10) {
    const b = awardBadge("profit_10pct"); if (b) newlyEarned.push(b);
  }
  if (conditions.isAllTimeHigh) {
    const b = awardBadge("all_time_high"); if (b) newlyEarned.push(b);
  }
  if (conditions.lessonsCompleted && conditions.lessonsCompleted >= 5) {
    const b = awardBadge("scholar"); if (b) newlyEarned.push(b);
  }
  if (conditions.alertSet) {
    const b = awardBadge("alert_set"); if (b) newlyEarned.push(b);
  }

  return newlyEarned;
}

// ── Streak ──────────────────────────────────────────────────────────────────

export type StreakData = { current: number; longest: number; lastVisit: string };

export function updateStreak(): StreakData {
  try {
    const raw = localStorage.getItem("streak");
    const data: StreakData = raw ? JSON.parse(raw) : { current: 0, longest: 0, lastVisit: "" };
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (data.lastVisit === today) return data;

    if (data.lastVisit === yesterday) {
      data.current += 1;
    } else if (data.lastVisit !== today) {
      data.current = 1;
    }
    data.longest = Math.max(data.longest, data.current);
    data.lastVisit = today;
    localStorage.setItem("streak", JSON.stringify(data));

    if (data.current >= 3)  awardBadge("streak_3");
    if (data.current >= 7)  awardBadge("streak_7");
    if (data.current >= 30) awardBadge("streak_30");

    return data;
  } catch { return { current: 1, longest: 1, lastVisit: new Date().toISOString().slice(0, 10) }; }
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem("streak");
    return raw ? JSON.parse(raw) : { current: 0, longest: 0, lastVisit: "" };
  } catch { return { current: 0, longest: 0, lastVisit: "" }; }
}

// ── XP ───────────────────────────────────────────────────────────────────────

export function addXP(amount: number): number {
  try {
    const xp = parseInt(localStorage.getItem("xp") ?? "0") + amount;
    localStorage.setItem("xp", String(xp));
    return xp;
  } catch { return 0; }
}

export function getXP(): number {
  try { return parseInt(localStorage.getItem("xp") ?? "0"); } catch { return 0; }
}

export function xpLevel(xp: number): { level: number; label: { he: string; en: string }; nextAt: number } {
  const levels = [
    { at: 0,    label: { he: "מתחיל",    en: "Beginner" } },
    { at: 100,  label: { he: "חוקר",     en: "Explorer" } },
    { at: 300,  label: { he: "סוחר",     en: "Trader" } },
    { at: 700,  label: { he: "אנליסט",   en: "Analyst" } },
    { at: 1500, label: { he: "מומחה",    en: "Expert" } },
    { at: 3000, label: { he: "גורו",     en: "Guru" } },
  ];
  let level = 0;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].at) level = i;
  }
  const nextAt = levels[level + 1]?.at ?? levels[levels.length - 1].at;
  return { level: level + 1, label: levels[level].label, nextAt };
}
