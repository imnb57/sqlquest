/**
 * XP, levels and ranks.
 *
 * The curve is superlinear but gentle: early levels arrive quickly (a single
 * lesson can carry you through two or three), and the spacing widens so that
 * a level still means something at 50 hours in. Everything here is pure and
 * deterministic so the client and server always agree.
 */

const BASE_XP = 60;
const EXPONENT = 1.45;
export const MAX_LEVEL = 60;

/** Cumulative XP required to *reach* a level. Level 1 starts at 0. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  const capped = Math.min(level, MAX_LEVEL);
  return Math.round(BASE_XP * Math.pow(capped - 1, EXPONENT) * 1.6);
}

/** Precomputed thresholds — the curve is static, so binary-search it. */
const THRESHOLDS: number[] = Array.from({ length: MAX_LEVEL + 1 }, (_, i) =>
  xpForLevel(i),
);

export function levelFromXp(xp: number): number {
  let lo = 1;
  let hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (THRESHOLDS[mid] <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export interface LevelProgress {
  level: number;
  /** XP accumulated inside the current level. */
  xpIntoLevel: number;
  /** XP the current level spans. */
  xpForNextLevel: number;
  /** 0–100. */
  percent: number;
  isMaxLevel: boolean;
  rank: Rank;
}

export function getLevelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const isMaxLevel = level >= MAX_LEVEL;
  const floor = THRESHOLDS[level];
  const ceiling = isMaxLevel ? floor : THRESHOLDS[level + 1];
  const span = Math.max(ceiling - floor, 1);
  const into = Math.max(xp - floor, 0);

  return {
    level,
    xpIntoLevel: into,
    xpForNextLevel: span,
    percent: isMaxLevel ? 100 : Math.min(100, (into / span) * 100),
    isMaxLevel,
    rank: rankForLevel(level),
  };
}

/* ------------------------------------------------------------------ Ranks */

export interface Rank {
  id: string;
  title: string;
  /** Inclusive lower bound. */
  minLevel: number;
  glyph: string;
  /** Tailwind gradient classes for the rank badge. */
  gradient: string;
  blurb: string;
}

export const RANKS: Rank[] = [
  {
    id: "initiate",
    title: "Initiate",
    minLevel: 1,
    glyph: "🌱",
    gradient: "from-emerald-400 to-teal-500",
    blurb: "You've written your first queries.",
  },
  {
    id: "apprentice",
    title: "Apprentice",
    minLevel: 6,
    glyph: "📖",
    gradient: "from-sky-400 to-blue-500",
    blurb: "Filtering and sorting are second nature.",
  },
  {
    id: "adept",
    title: "Adept",
    minLevel: 13,
    glyph: "🔗",
    gradient: "from-indigo-400 to-violet-500",
    blurb: "Joins hold no fear.",
  },
  {
    id: "analyst",
    title: "Analyst",
    minLevel: 22,
    glyph: "📊",
    gradient: "from-amber-400 to-orange-500",
    blurb: "You turn tables into answers.",
  },
  {
    id: "architect",
    title: "Architect",
    minLevel: 32,
    glyph: "🪄",
    gradient: "from-violet-400 to-fuchsia-500",
    blurb: "CTEs and window functions are tools, not tricks.",
  },
  {
    id: "optimiser",
    title: "Optimiser",
    minLevel: 44,
    glyph: "⚡",
    gradient: "from-yellow-400 to-amber-500",
    blurb: "You read plans before you write indexes.",
  },
  {
    id: "grandmaster",
    title: "Grandmaster",
    minLevel: 55,
    glyph: "👑",
    gradient: "from-rose-400 to-pink-500",
    blurb: "There is no query you can't reason about.",
  },
];

export function rankForLevel(level: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.minLevel) current = rank;
    else break;
  }
  return current;
}

/* ---------------------------------------------------------------- Leagues */

export interface League {
  id: string;
  name: string;
  glyph: string;
  color: string;
  /** Weekly XP needed to be promoted out of this league. */
  promotionXp: number;
}

export const LEAGUES: League[] = [
  { id: "copper", name: "Copper", glyph: "🥉", color: "#b87333", promotionXp: 150 },
  { id: "silver", name: "Silver", glyph: "🥈", color: "#a8b3c4", promotionXp: 300 },
  { id: "gold", name: "Gold", glyph: "🥇", color: "#e0b64a", promotionXp: 500 },
  { id: "sapphire", name: "Sapphire", glyph: "💎", color: "#3b82f6", promotionXp: 800 },
  { id: "obsidian", name: "Obsidian", glyph: "🖤", color: "#4b4b5c", promotionXp: 1200 },
  { id: "aurora", name: "Aurora", glyph: "🌌", color: "#a855f7", promotionXp: Infinity },
];

export function leagueForWeeklyXp(weeklyXp: number): League {
  let current = LEAGUES[0];
  for (const l of LEAGUES) {
    if (weeklyXp >= l.promotionXp) {
      const next = LEAGUES[LEAGUES.indexOf(l) + 1];
      if (next) current = next;
    }
  }
  return current;
}

/* ------------------------------------------------------------------ Bonus */

/**
 * XP multipliers that make a session feel better the longer you keep going.
 * Capped so nothing runaway can happen from a long grind.
 */
export function streakMultiplier(streak: number): number {
  if (streak >= 100) return 2;
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.3;
  if (streak >= 7) return 1.2;
  if (streak >= 3) return 1.1;
  return 1;
}

/** Solving every challenge first-try earns a flat completion bonus. */
export const PERFECT_LESSON_BONUS = 25;
export const DAILY_GOAL_BONUS = 20;
export const COMBO_STEP = 5;
export const MAX_COMBO_BONUS = 25;

export function comboBonus(streakOfCorrect: number): number {
  if (streakOfCorrect < 3) return 0;
  return Math.min((streakOfCorrect - 2) * COMBO_STEP, MAX_COMBO_BONUS);
}
