import { hashToUnit } from "@/lib/utils";

/**
 * Daily quests.
 *
 * Three quests per day, chosen deterministically from the day key so every
 * device shows the same set without a server round trip, and so a quest can't
 * be rerolled by refreshing.
 */

export type QuestMetric =
  | "xpToday"
  | "challengesToday"
  | "lessonsToday"
  | "perfectChallengesToday"
  | "minutesToday"
  | "playgroundQueriesToday";

export interface QuestTemplate {
  id: string;
  title: string;
  description: (goal: number) => string;
  glyph: string;
  metric: QuestMetric;
  /** Candidate goals; one is picked per day. */
  goals: number[];
  gemReward: number;
  xpReward: number;
}

const TEMPLATES: QuestTemplate[] = [
  {
    id: "earn-xp",
    title: "Earn XP",
    description: (g) => `Earn ${g} XP today`,
    glyph: "⚡",
    metric: "xpToday",
    goals: [30, 50, 80],
    gemReward: 10,
    xpReward: 10,
  },
  {
    id: "solve-challenges",
    title: "Solve challenges",
    description: (g) => `Solve ${g} challenges`,
    glyph: "🎯",
    metric: "challengesToday",
    goals: [5, 8, 12],
    gemReward: 10,
    xpReward: 15,
  },
  {
    id: "finish-lesson",
    title: "Finish a lesson",
    description: (g) => `Complete ${g} lesson${g > 1 ? "s" : ""}`,
    glyph: "📗",
    metric: "lessonsToday",
    goals: [1, 2, 3],
    gemReward: 15,
    xpReward: 20,
  },
  {
    id: "flawless",
    title: "Be precise",
    description: (g) => `Get ${g} answers right first try`,
    glyph: "💎",
    metric: "perfectChallengesToday",
    goals: [3, 5, 8],
    gemReward: 15,
    xpReward: 20,
  },
  {
    id: "time-invested",
    title: "Put in the time",
    description: (g) => `Practise for ${g} minutes`,
    glyph: "⏱️",
    metric: "minutesToday",
    goals: [10, 15, 25],
    gemReward: 10,
    xpReward: 15,
  },
  {
    id: "experiment",
    title: "Experiment",
    description: (g) => `Run ${g} queries in the playground`,
    glyph: "🧪",
    metric: "playgroundQueriesToday",
    goals: [3, 5, 10],
    gemReward: 10,
    xpReward: 10,
  },
];

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  glyph: string;
  metric: QuestMetric;
  goal: number;
  gemReward: number;
  xpReward: number;
}

/** Deterministic per-day selection of three distinct quests. */
export function questsForDay(dayKey: string): DailyQuest[] {
  const ordered = [...TEMPLATES]
    .map((t) => ({ t, k: hashToUnit(`${dayKey}:${t.id}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 3);

  return ordered.map(({ t }) => {
    const goal = t.goals[Math.floor(hashToUnit(`${dayKey}:${t.id}:goal`) * t.goals.length)];
    return {
      id: t.id,
      title: t.title,
      description: t.description(goal),
      glyph: t.glyph,
      metric: t.metric,
      goal,
      gemReward: t.gemReward,
      xpReward: t.xpReward,
    };
  });
}

export interface DailyCounters {
  xpToday: number;
  challengesToday: number;
  lessonsToday: number;
  perfectChallengesToday: number;
  minutesToday: number;
  playgroundQueriesToday: number;
}

export const emptyCounters = (): DailyCounters => ({
  xpToday: 0,
  challengesToday: 0,
  lessonsToday: 0,
  perfectChallengesToday: 0,
  minutesToday: 0,
  playgroundQueriesToday: 0,
});

export interface QuestState extends DailyQuest {
  progress: number;
  complete: boolean;
  percent: number;
}

export function evaluateQuests(
  quests: DailyQuest[],
  counters: DailyCounters,
): QuestState[] {
  return quests.map((q) => {
    const progress = Math.min(counters[q.metric] ?? 0, q.goal);
    return {
      ...q,
      progress,
      complete: progress >= q.goal,
      percent: (progress / q.goal) * 100,
    };
  });
}
