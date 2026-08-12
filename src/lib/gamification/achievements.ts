/**
 * Achievements.
 *
 * Each definition is a pure predicate over a progress snapshot, which means
 * the same code evaluates them on the client (for the instant unlock toast)
 * and on the server (for the durable record) with no risk of divergence.
 */

export type AchievementCategory =
  | "progress"
  | "streak"
  | "mastery"
  | "exploration"
  | "secret";

export interface AchievementSnapshot {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lessonsCompleted: number;
  challengesSolved: number;
  perfectLessons: number;
  tracksCompleted: number;
  bossesDefeated: number;
  playgroundQueriesRun: number;
  hintsUsed: number;
  /** Lessons finished without revealing a single hint. */
  noHintLessons: number;
  /** Distinct local-day keys with any activity. */
  activeDays: number;
  /** Solved between 00:00 and 05:00 local. */
  nightOwlSolves: number;
  /** Solved between 05:00 and 08:00 local. */
  earlyBirdSolves: number;
  fastestSolveMs: number;
  datasetsExplored: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  glyph: string;
  category: AchievementCategory;
  /** Higher tiers are rarer and worth more gems. */
  tier: "bronze" | "silver" | "gold" | "legendary";
  gemReward: number;
  /** Target used for the progress bar; 1 for binary achievements. */
  goal: number;
  /** Current progress toward `goal`. */
  measure: (s: AchievementSnapshot) => number;
  /** Hidden until unlocked. */
  secret?: boolean;
}

const TIER_GEMS = { bronze: 10, silver: 25, gold: 60, legendary: 150 } as const;

function make(
  a: Omit<Achievement, "gemReward"> & { gemReward?: number },
): Achievement {
  return { gemReward: a.gemReward ?? TIER_GEMS[a.tier], ...a };
}

export const ACHIEVEMENTS: Achievement[] = [
  /* ------------------------------------------------------------- progress */
  make({
    id: "first-query",
    title: "Hello, World",
    description: "Solve your very first challenge.",
    glyph: "👋",
    category: "progress",
    tier: "bronze",
    goal: 1,
    measure: (s) => s.challengesSolved,
  }),
  make({
    id: "ten-challenges",
    title: "Getting Warm",
    description: "Solve 10 challenges.",
    glyph: "🔥",
    category: "progress",
    tier: "bronze",
    goal: 10,
    measure: (s) => s.challengesSolved,
  }),
  make({
    id: "fifty-challenges",
    title: "Query Machine",
    description: "Solve 50 challenges.",
    glyph: "⚙️",
    category: "progress",
    tier: "silver",
    goal: 50,
    measure: (s) => s.challengesSolved,
  }),
  make({
    id: "two-hundred-challenges",
    title: "Relentless",
    description: "Solve 200 challenges.",
    glyph: "🏋️",
    category: "progress",
    tier: "gold",
    goal: 200,
    measure: (s) => s.challengesSolved,
  }),
  make({
    id: "first-lesson",
    title: "One Down",
    description: "Complete your first lesson.",
    glyph: "✅",
    category: "progress",
    tier: "bronze",
    goal: 1,
    measure: (s) => s.lessonsCompleted,
  }),
  make({
    id: "ten-lessons",
    title: "Building Momentum",
    description: "Complete 10 lessons.",
    glyph: "🚀",
    category: "progress",
    tier: "silver",
    goal: 10,
    measure: (s) => s.lessonsCompleted,
  }),
  make({
    id: "all-lessons",
    title: "Completionist",
    description: "Complete every lesson in the curriculum.",
    glyph: "🏆",
    category: "progress",
    tier: "legendary",
    goal: 44,
    measure: (s) => s.lessonsCompleted,
  }),
  make({
    id: "level-10",
    title: "Double Digits",
    description: "Reach level 10.",
    glyph: "🔟",
    category: "progress",
    tier: "silver",
    goal: 10,
    measure: (s) => s.level,
  }),
  make({
    id: "level-25",
    title: "Seasoned",
    description: "Reach level 25.",
    glyph: "🎖️",
    category: "progress",
    tier: "gold",
    goal: 25,
    measure: (s) => s.level,
  }),
  make({
    id: "level-50",
    title: "Ascendant",
    description: "Reach level 50.",
    glyph: "🌟",
    category: "progress",
    tier: "legendary",
    goal: 50,
    measure: (s) => s.level,
  }),

  /* --------------------------------------------------------------- streak */
  make({
    id: "streak-3",
    title: "Spark",
    description: "Practise 3 days in a row.",
    glyph: "✨",
    category: "streak",
    tier: "bronze",
    goal: 3,
    measure: (s) => s.longestStreak,
  }),
  make({
    id: "streak-7",
    title: "Week Strong",
    description: "Keep a 7-day streak.",
    glyph: "📅",
    category: "streak",
    tier: "silver",
    goal: 7,
    measure: (s) => s.longestStreak,
  }),
  make({
    id: "streak-30",
    title: "Unbroken",
    description: "Keep a 30-day streak.",
    glyph: "🗓️",
    category: "streak",
    tier: "gold",
    goal: 30,
    measure: (s) => s.longestStreak,
  }),
  make({
    id: "streak-100",
    title: "Centurion",
    description: "Keep a 100-day streak.",
    glyph: "💯",
    category: "streak",
    tier: "legendary",
    goal: 100,
    measure: (s) => s.longestStreak,
  }),
  make({
    id: "active-50-days",
    title: "Regular",
    description: "Practise on 50 different days.",
    glyph: "🌤️",
    category: "streak",
    tier: "gold",
    goal: 50,
    measure: (s) => s.activeDays,
  }),

  /* -------------------------------------------------------------- mastery */
  make({
    id: "perfect-lesson",
    title: "Flawless",
    description: "Finish a lesson with every answer right first time.",
    glyph: "💎",
    category: "mastery",
    tier: "silver",
    goal: 1,
    measure: (s) => s.perfectLessons,
  }),
  make({
    id: "ten-perfect",
    title: "Precision Engineer",
    description: "Finish 10 lessons flawlessly.",
    glyph: "🎯",
    category: "mastery",
    tier: "gold",
    goal: 10,
    measure: (s) => s.perfectLessons,
  }),
  make({
    id: "no-hints",
    title: "Unassisted",
    description: "Complete 5 lessons without revealing a hint.",
    glyph: "🧠",
    category: "mastery",
    tier: "gold",
    goal: 5,
    measure: (s) => s.noHintLessons,
  }),
  make({
    id: "first-boss",
    title: "Gatekeeper Down",
    description: "Defeat your first checkpoint.",
    glyph: "⚔️",
    category: "mastery",
    tier: "silver",
    goal: 1,
    measure: (s) => s.bossesDefeated,
  }),
  make({
    id: "all-bosses",
    title: "Boss Rush",
    description: "Defeat every checkpoint in the curriculum.",
    glyph: "🐉",
    category: "mastery",
    tier: "legendary",
    goal: 5,
    measure: (s) => s.bossesDefeated,
  }),
  make({
    id: "track-complete",
    title: "Track Cleared",
    description: "Complete an entire track.",
    glyph: "🛤️",
    category: "mastery",
    tier: "gold",
    goal: 1,
    measure: (s) => s.tracksCompleted,
  }),

  /* ---------------------------------------------------------- exploration */
  make({
    id: "playground-10",
    title: "Tinkerer",
    description: "Run 10 queries in the playground.",
    glyph: "🧪",
    category: "exploration",
    tier: "bronze",
    goal: 10,
    measure: (s) => s.playgroundQueriesRun,
  }),
  make({
    id: "playground-100",
    title: "Mad Scientist",
    description: "Run 100 queries in the playground.",
    glyph: "⚗️",
    category: "exploration",
    tier: "gold",
    goal: 100,
    measure: (s) => s.playgroundQueriesRun,
  }),
  make({
    id: "all-datasets",
    title: "Cartographer",
    description: "Query every dataset at least once.",
    glyph: "🗺️",
    category: "exploration",
    tier: "silver",
    goal: 6,
    measure: (s) => s.datasetsExplored,
  }),

  /* --------------------------------------------------------------- secret */
  make({
    id: "night-owl",
    title: "Night Owl",
    description: "Solve 10 challenges between midnight and 5am.",
    glyph: "🦉",
    category: "secret",
    tier: "silver",
    goal: 10,
    measure: (s) => s.nightOwlSolves,
    secret: true,
  }),
  make({
    id: "early-bird",
    title: "Early Bird",
    description: "Solve 10 challenges before 8am.",
    glyph: "🐦",
    category: "secret",
    tier: "silver",
    goal: 10,
    measure: (s) => s.earlyBirdSolves,
    secret: true,
  }),
  make({
    id: "speed-demon",
    title: "Speed Demon",
    description: "Solve a query challenge in under 15 seconds.",
    glyph: "💨",
    category: "secret",
    tier: "gold",
    goal: 1,
    measure: (s) => (s.fastestSolveMs > 0 && s.fastestSolveMs < 15_000 ? 1 : 0),
    secret: true,
  }),
];

export const achievementById = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export interface AchievementState {
  achievement: Achievement;
  progress: number;
  unlocked: boolean;
  percent: number;
}

export function evaluateAchievements(
  snapshot: AchievementSnapshot,
): AchievementState[] {
  return ACHIEVEMENTS.map((achievement) => {
    const progress = Math.min(achievement.measure(snapshot), achievement.goal);
    return {
      achievement,
      progress,
      unlocked: progress >= achievement.goal,
      percent: (progress / achievement.goal) * 100,
    };
  });
}

/** Ids newly satisfied since the previous evaluation. */
export function newlyUnlocked(
  snapshot: AchievementSnapshot,
  alreadyUnlocked: ReadonlySet<string>,
): Achievement[] {
  return evaluateAchievements(snapshot)
    .filter((s) => s.unlocked && !alreadyUnlocked.has(s.achievement.id))
    .map((s) => s.achievement);
}

export const TIER_STYLES: Record<
  Achievement["tier"],
  { ring: string; bg: string; text: string; label: string }
> = {
  bronze: {
    ring: "ring-amber-700/40",
    bg: "bg-gradient-to-br from-amber-600/20 to-amber-800/10",
    text: "text-amber-700 dark:text-amber-400",
    label: "Bronze",
  },
  silver: {
    ring: "ring-slate-400/40",
    bg: "bg-gradient-to-br from-slate-400/20 to-slate-500/10",
    text: "text-slate-600 dark:text-slate-300",
    label: "Silver",
  },
  gold: {
    ring: "ring-yellow-500/40",
    bg: "bg-gradient-to-br from-yellow-400/25 to-amber-500/10",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Gold",
  },
  legendary: {
    ring: "ring-fuchsia-500/40",
    bg: "bg-gradient-to-br from-fuchsia-500/25 to-violet-600/15",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    label: "Legendary",
  },
};
