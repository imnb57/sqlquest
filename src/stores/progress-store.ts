"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { localDayKey, daysBetweenKeys, clamp } from "@/lib/utils";
import {
  MAX_HEARTS,
  HEART_REFILL_GEM_COST,
  regenerateHearts,
  type HeartSnapshot,
} from "@/lib/gamification/hearts";
import {
  getLevelProgress,
  type LevelProgress,
  streakMultiplier,
  PERFECT_LESSON_BONUS,
  DAILY_GOAL_BONUS,
  comboBonus,
} from "@/lib/gamification/levels";
import {
  newlyUnlocked,
  type Achievement,
  type AchievementSnapshot,
} from "@/lib/gamification/achievements";
import {
  emptyCounters,
  evaluateQuests,
  questsForDay,
  type DailyCounters,
  type QuestState,
} from "@/lib/gamification/quests";

/**
 * Progress lives in the browser first.
 *
 * Every lesson interaction writes here synchronously so the UI never waits on
 * a network round trip, and the whole app stays usable offline and signed out.
 * When a session exists, `syncToServer` pushes a snapshot; the server is a
 * durable backup and a leaderboard source, not the hot path.
 */

/* ------------------------------------------------------------------ shapes */

export interface LessonRecord {
  status: "in_progress" | "completed";
  bestScore: number;
  attempts: number;
  xpEarned: number;
  secondsSpent: number;
  /** Challenge ids solved at least once, for resuming mid-lesson. */
  solved: string[];
  hintsUsed: number;
  startedAt: string;
  completedAt?: string;
}

export interface ChallengeRecord {
  attempts: number;
  correct: boolean;
  /** Solved on the very first submission with no hints. */
  firstTry: boolean;
  hintsUsed: number;
  bestMs: number;
}

export interface CapstoneRecord {
  /** Milestone ids solved, in completion order. */
  completed: string[];
  /** Last accepted submission per milestone, for the deliverables board. */
  submissions: Record<string, string>;
  startedAt: string;
  completedAt?: string;
}

export interface DayRecord {
  xp: number;
  lessons: number;
  challenges: number;
  seconds: number;
}

interface ProgressState {
  version: number;
  hasHydrated: boolean;

  xp: number;
  gems: number;
  hearts: number;
  heartsUpdatedAt: string;

  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  streakFreezes: number;
  dailyGoal: number;

  lessons: Record<string, LessonRecord>;
  challenges: Record<string, ChallengeRecord>;
  unlockedAchievements: string[];

  /** Per-day activity, keyed by local YYYY-MM-DD. Trimmed to the last year. */
  activity: Record<string, DayRecord>;

  countersDay: string;
  counters: DailyCounters;
  claimedQuests: string[];

  /** Lifetime counters that don't fit the per-lesson records. */
  playgroundQueriesRun: number;
  datasetsExplored: string[];
  nightOwlSolves: number;
  earlyBirdSolves: number;
  fastestSolveMs: number;
  perfectLessons: number;
  noHintLessons: number;
  bossesDefeated: number;
  tracksCompleted: string[];

  /** Capstone project progress, keyed by capstone id. */
  capstones: Record<string, CapstoneRecord>;

  /** Consecutive correct answers in the current session; drives combo XP. */
  combo: number;

  lastSyncedAt: string | null;
}

export interface ChallengeOutcome {
  lessonId: string;
  challengeId: string;
  correct: boolean;
  hintsUsed: number;
  durationMs: number;
  baseXp: number;
  /** Practice mode and the playground never cost hearts. */
  costsHearts?: boolean;
}

export interface ChallengeResultSummary {
  xpAwarded: number;
  comboBonus: number;
  newCombo: number;
  heartsRemaining: number;
  leveledUpTo?: number;
  unlocked: Achievement[];
}

export interface LessonCompletion {
  lessonId: string;
  isBoss?: boolean;
  trackId?: string;
  secondsSpent: number;
  totalChallenges: number;
  firstTryCorrect: number;
  hintsUsed: number;
}

export interface LessonCompletionSummary {
  xpAwarded: number;
  perfect: boolean;
  score: number;
  streak: number;
  streakExtended: boolean;
  goalMet: boolean;
  leveledUpTo?: number;
  unlocked: Achievement[];
}

interface ProgressActions {
  setHydrated: () => void;

  recordChallenge: (outcome: ChallengeOutcome) => ChallengeResultSummary;
  completeLesson: (completion: LessonCompletion) => LessonCompletionSummary;
  startLesson: (lessonId: string) => void;
  resetCombo: () => void;

  spendGems: (amount: number) => boolean;
  refillHearts: () => boolean;
  loseHeart: () => number;

  claimQuest: (questId: string) => boolean;
  setDailyGoal: (goal: number) => void;

  recordPlaygroundRun: (datasetId: string) => void;
  completeMilestone: (args: {
    capstoneId: string;
    milestoneId: string;
    submission: string;
    totalMilestones: number;
    xp: number;
  }) => { xpAwarded: number; projectComplete: boolean };

  hydrateFromServer: (snapshot: Partial<ProgressState>) => void;
  markSynced: () => void;
  resetProgress: () => void;
}

export type ProgressStore = ProgressState & ProgressActions;

/* ----------------------------------------------------------------- helpers */

const STORAGE_KEY = "sqlquest:progress";
const STORE_VERSION = 1;
/** Keep roughly a year of daily history; the heatmap never shows more. */
const ACTIVITY_RETENTION_DAYS = 400;

function initialState(): ProgressState {
  return {
    version: STORE_VERSION,
    hasHydrated: false,
    xp: 0,
    gems: 50,
    hearts: MAX_HEARTS,
    heartsUpdatedAt: new Date().toISOString(),
    streak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    streakFreezes: 0,
    dailyGoal: 50,
    lessons: {},
    challenges: {},
    unlockedAchievements: [],
    activity: {},
    countersDay: localDayKey(),
    counters: emptyCounters(),
    claimedQuests: [],
    playgroundQueriesRun: 0,
    datasetsExplored: [],
    nightOwlSolves: 0,
    earlyBirdSolves: 0,
    fastestSolveMs: 0,
    perfectLessons: 0,
    noHintLessons: 0,
    bossesDefeated: 0,
    tracksCompleted: [],
    capstones: {},
    combo: 0,
    lastSyncedAt: null,
  };
}

/** Drops day records older than the retention window. */
function trimActivity(activity: Record<string, DayRecord>): Record<string, DayRecord> {
  const today = localDayKey();
  const out: Record<string, DayRecord> = {};
  for (const [day, rec] of Object.entries(activity)) {
    if (Math.abs(daysBetweenKeys(day, today)) <= ACTIVITY_RETENTION_DAYS) {
      out[day] = rec;
    }
  }
  return out;
}

function addToDay(
  activity: Record<string, DayRecord>,
  day: string,
  delta: Partial<DayRecord>,
): Record<string, DayRecord> {
  const existing = activity[day] ?? { xp: 0, lessons: 0, challenges: 0, seconds: 0 };
  return {
    ...activity,
    [day]: {
      xp: existing.xp + (delta.xp ?? 0),
      lessons: existing.lessons + (delta.lessons ?? 0),
      challenges: existing.challenges + (delta.challenges ?? 0),
      seconds: existing.seconds + (delta.seconds ?? 0),
    },
  };
}

/** Rolls daily counters over when the local day has changed. */
function rolledCounters(state: ProgressState): {
  countersDay: string;
  counters: DailyCounters;
  claimedQuests: string[];
} {
  const today = localDayKey();
  if (state.countersDay === today) {
    return {
      countersDay: state.countersDay,
      counters: state.counters,
      claimedQuests: state.claimedQuests,
    };
  }
  return { countersDay: today, counters: emptyCounters(), claimedQuests: [] };
}

function snapshotFor(state: ProgressState): AchievementSnapshot {
  const level = getLevelProgress(state.xp).level;
  return {
    xp: state.xp,
    level,
    streak: state.streak,
    longestStreak: state.longestStreak,
    lessonsCompleted: Object.values(state.lessons).filter(
      (l) => l.status === "completed",
    ).length,
    challengesSolved: Object.values(state.challenges).filter((c) => c.correct).length,
    perfectLessons: state.perfectLessons,
    tracksCompleted: state.tracksCompleted.length,
    bossesDefeated: state.bossesDefeated,
    playgroundQueriesRun: state.playgroundQueriesRun,
    hintsUsed: Object.values(state.challenges).reduce((s, c) => s + c.hintsUsed, 0),
    noHintLessons: state.noHintLessons,
    activeDays: Object.keys(state.activity).length,
    nightOwlSolves: state.nightOwlSolves,
    earlyBirdSolves: state.earlyBirdSolves,
    fastestSolveMs: state.fastestSolveMs,
    datasetsExplored: state.datasetsExplored.length,
  };
}

/* ------------------------------------------------------------------- store */

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setHydrated: () => set({ hasHydrated: true }),

      startLesson: (lessonId) =>
        set((state) => {
          if (state.lessons[lessonId]) return state;
          return {
            lessons: {
              ...state.lessons,
              [lessonId]: {
                status: "in_progress",
                bestScore: 0,
                attempts: 0,
                xpEarned: 0,
                secondsSpent: 0,
                solved: [],
                hintsUsed: 0,
                startedAt: new Date().toISOString(),
              },
            },
          };
        }),

      resetCombo: () => set({ combo: 0 }),

      recordChallenge: (outcome) => {
        const state = get();
        const roll = rolledCounters(state);
        const now = new Date();
        const day = localDayKey(now);
        const hour = now.getHours();

        const previous = state.challenges[outcome.challengeId];
        const alreadySolved = previous?.correct ?? false;

        /* -- hearts ----------------------------------------------------- */
        const heartSnapshot = regenerateHearts(
          { hearts: state.hearts, updatedAt: state.heartsUpdatedAt },
          now.getTime(),
        );
        let hearts = heartSnapshot.hearts;
        let heartsUpdatedAt = heartSnapshot.updatedAt;
        if (!outcome.correct && outcome.costsHearts !== false && hearts > 0) {
          // Starting the regen clock only on the first lost heart means a full
          // bar doesn't silently "bank" regeneration time.
          if (hearts === MAX_HEARTS) heartsUpdatedAt = now.toISOString();
          hearts -= 1;
        }

        /* -- combo + xp -------------------------------------------------- */
        const combo = outcome.correct ? state.combo + 1 : 0;
        const bonus = outcome.correct ? comboBonus(combo) : 0;
        // Re-solving an already-solved challenge is worth practice, not XP.
        const hintPenalty = Math.min(outcome.hintsUsed * 0.2, 0.6);
        const earned =
          outcome.correct && !alreadySolved
            ? Math.max(1, Math.round(outcome.baseXp * (1 - hintPenalty)) + bonus)
            : 0;

        const xp = state.xp + earned;
        const previousLevel = getLevelProgress(state.xp).level;
        const nextLevel = getLevelProgress(xp).level;

        /* -- records ----------------------------------------------------- */
        const challengeRecord: ChallengeRecord = {
          attempts: (previous?.attempts ?? 0) + 1,
          correct: alreadySolved || outcome.correct,
          firstTry:
            previous?.firstTry ??
            (outcome.correct && !previous && outcome.hintsUsed === 0),
          hintsUsed: (previous?.hintsUsed ?? 0) + outcome.hintsUsed,
          bestMs:
            outcome.correct && outcome.durationMs > 0
              ? Math.min(previous?.bestMs || Infinity, outcome.durationMs)
              : (previous?.bestMs ?? 0),
        };

        const lesson = state.lessons[outcome.lessonId] ?? {
          status: "in_progress" as const,
          bestScore: 0,
          attempts: 0,
          xpEarned: 0,
          secondsSpent: 0,
          solved: [],
          hintsUsed: 0,
          startedAt: now.toISOString(),
        };

        const solved =
          outcome.correct && !lesson.solved.includes(outcome.challengeId)
            ? [...lesson.solved, outcome.challengeId]
            : lesson.solved;

        const counters: DailyCounters = {
          ...roll.counters,
          xpToday: roll.counters.xpToday + earned,
          challengesToday:
            roll.counters.challengesToday + (outcome.correct && !alreadySolved ? 1 : 0),
          perfectChallengesToday:
            roll.counters.perfectChallengesToday +
            (outcome.correct && !previous && outcome.hintsUsed === 0 ? 1 : 0),
        };

        const fastest =
          outcome.correct && outcome.durationMs > 0
            ? state.fastestSolveMs > 0
              ? Math.min(state.fastestSolveMs, outcome.durationMs)
              : outcome.durationMs
            : state.fastestSolveMs;

        const nextState: ProgressState = {
          ...state,
          ...roll,
          counters,
          xp,
          hearts,
          heartsUpdatedAt,
          combo,
          fastestSolveMs: fastest,
          nightOwlSolves:
            state.nightOwlSolves + (outcome.correct && hour < 5 ? 1 : 0),
          earlyBirdSolves:
            state.earlyBirdSolves + (outcome.correct && hour >= 5 && hour < 8 ? 1 : 0),
          challenges: { ...state.challenges, [outcome.challengeId]: challengeRecord },
          lessons: {
            ...state.lessons,
            [outcome.lessonId]: {
              ...lesson,
              attempts: lesson.attempts + 1,
              solved,
              hintsUsed: lesson.hintsUsed + outcome.hintsUsed,
              xpEarned: lesson.xpEarned + earned,
            },
          },
          activity: addToDay(state.activity, day, {
            xp: earned,
            challenges: outcome.correct && !alreadySolved ? 1 : 0,
          }),
        };

        const unlocked = newlyUnlocked(
          snapshotFor(nextState),
          new Set(state.unlockedAchievements),
        );

        set({
          ...nextState,
          unlockedAchievements: [
            ...state.unlockedAchievements,
            ...unlocked.map((a) => a.id),
          ],
          gems: state.gems + unlocked.reduce((s, a) => s + a.gemReward, 0),
        });

        return {
          xpAwarded: earned,
          comboBonus: bonus,
          newCombo: combo,
          heartsRemaining: hearts,
          leveledUpTo: nextLevel > previousLevel ? nextLevel : undefined,
          unlocked,
        };
      },

      completeLesson: (completion) => {
        const state = get();
        const roll = rolledCounters(state);
        const today = localDayKey();

        const score =
          completion.totalChallenges > 0
            ? Math.round((completion.firstTryCorrect / completion.totalChallenges) * 100)
            : 0;
        const perfect = score === 100;

        /* -- streak ------------------------------------------------------ */
        let streak = state.streak;
        let streakFreezes = state.streakFreezes;
        let streakExtended = false;

        if (state.lastActiveDay !== today) {
          const gap = state.lastActiveDay
            ? daysBetweenKeys(state.lastActiveDay, today)
            : 1;
          if (gap === 1) {
            streak += 1;
            streakExtended = true;
          } else if (gap > 1 && streakFreezes > 0 && gap - 1 <= streakFreezes) {
            // Freezes cover the missed days rather than resetting to zero.
            streakFreezes -= gap - 1;
            streak += 1;
            streakExtended = true;
          } else {
            streak = 1;
            streakExtended = true;
          }
        }

        /* -- xp ---------------------------------------------------------- */
        const multiplier = streakMultiplier(streak);
        const alreadyComplete =
          state.lessons[completion.lessonId]?.status === "completed";

        let awarded = 0;
        if (!alreadyComplete) {
          awarded += Math.round(20 * multiplier);
          if (perfect) awarded += PERFECT_LESSON_BONUS;
        }

        const xpTodayBefore = roll.counters.xpToday;
        const goalMet =
          xpTodayBefore + awarded >= state.dailyGoal &&
          xpTodayBefore < state.dailyGoal;
        if (goalMet) awarded += DAILY_GOAL_BONUS;

        const xp = state.xp + awarded;
        const previousLevel = getLevelProgress(state.xp).level;
        const nextLevel = getLevelProgress(xp).level;

        const existing = state.lessons[completion.lessonId];
        const record: LessonRecord = {
          status: "completed",
          bestScore: Math.max(existing?.bestScore ?? 0, score),
          attempts: (existing?.attempts ?? 0) + 1,
          xpEarned: (existing?.xpEarned ?? 0) + awarded,
          secondsSpent: (existing?.secondsSpent ?? 0) + completion.secondsSpent,
          solved: existing?.solved ?? [],
          hintsUsed: (existing?.hintsUsed ?? 0) + completion.hintsUsed,
          startedAt: existing?.startedAt ?? new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        const nextState: ProgressState = {
          ...state,
          ...roll,
          xp,
          streak,
          streakFreezes,
          longestStreak: Math.max(state.longestStreak, streak),
          lastActiveDay: today,
          lessons: { ...state.lessons, [completion.lessonId]: record },
          perfectLessons: state.perfectLessons + (perfect && !alreadyComplete ? 1 : 0),
          noHintLessons:
            state.noHintLessons +
            (completion.hintsUsed === 0 && !alreadyComplete ? 1 : 0),
          bossesDefeated:
            state.bossesDefeated + (completion.isBoss && !alreadyComplete ? 1 : 0),
          counters: {
            ...roll.counters,
            xpToday: roll.counters.xpToday + awarded,
            lessonsToday: roll.counters.lessonsToday + (alreadyComplete ? 0 : 1),
            minutesToday:
              roll.counters.minutesToday + Math.round(completion.secondsSpent / 60),
          },
          activity: trimActivity(
            addToDay(state.activity, today, {
              xp: awarded,
              lessons: alreadyComplete ? 0 : 1,
              seconds: completion.secondsSpent,
            }),
          ),
          combo: 0,
        };

        const unlocked = newlyUnlocked(
          snapshotFor(nextState),
          new Set(state.unlockedAchievements),
        );

        set({
          ...nextState,
          unlockedAchievements: [
            ...state.unlockedAchievements,
            ...unlocked.map((a) => a.id),
          ],
          gems:
            state.gems +
            unlocked.reduce((s, a) => s + a.gemReward, 0) +
            (perfect && !alreadyComplete ? 5 : 0),
        });

        return {
          xpAwarded: awarded,
          perfect,
          score,
          streak,
          streakExtended,
          goalMet,
          leveledUpTo: nextLevel > previousLevel ? nextLevel : undefined,
          unlocked,
        };
      },

      spendGems: (amount) => {
        const { gems } = get();
        if (gems < amount) return false;
        set({ gems: gems - amount });
        return true;
      },

      refillHearts: () => {
        const state = get();
        if (state.gems < HEART_REFILL_GEM_COST) return false;
        set({
          gems: state.gems - HEART_REFILL_GEM_COST,
          hearts: MAX_HEARTS,
          heartsUpdatedAt: new Date().toISOString(),
        });
        return true;
      },

      loseHeart: () => {
        const state = get();
        const snapshot = regenerateHearts({
          hearts: state.hearts,
          updatedAt: state.heartsUpdatedAt,
        });
        const hearts = Math.max(0, snapshot.hearts - 1);
        set({
          hearts,
          heartsUpdatedAt:
            snapshot.hearts === MAX_HEARTS
              ? new Date().toISOString()
              : snapshot.updatedAt,
        });
        return hearts;
      },

      claimQuest: (questId) => {
        const state = get();
        const roll = rolledCounters(state);
        if (roll.claimedQuests.includes(questId)) return false;

        const quest = questsForDay(roll.countersDay).find((q) => q.id === questId);
        if (!quest) return false;

        const progress = roll.counters[quest.metric] ?? 0;
        if (progress < quest.goal) return false;

        set({
          ...roll,
          claimedQuests: [...roll.claimedQuests, questId],
          gems: state.gems + quest.gemReward,
          xp: state.xp + quest.xpReward,
        });
        return true;
      },

      setDailyGoal: (goal) => set({ dailyGoal: clamp(goal, 10, 200) }),

      recordPlaygroundRun: (datasetId) =>
        set((state) => {
          const roll = rolledCounters(state);
          return {
            ...roll,
            playgroundQueriesRun: state.playgroundQueriesRun + 1,
            datasetsExplored: state.datasetsExplored.includes(datasetId)
              ? state.datasetsExplored
              : [...state.datasetsExplored, datasetId],
            counters: {
              ...roll.counters,
              playgroundQueriesToday: roll.counters.playgroundQueriesToday + 1,
            },
          };
        }),

      completeMilestone: ({ capstoneId, milestoneId, submission, totalMilestones, xp }) => {
        const state = get();
        const roll = rolledCounters(state);
        const today = localDayKey();

        const existing = state.capstones[capstoneId] ?? {
          completed: [],
          submissions: {},
          startedAt: new Date().toISOString(),
        };

        // Re-solving a milestone is fine, but it doesn't pay twice.
        const alreadyDone = existing.completed.includes(milestoneId);
        const completed = alreadyDone
          ? existing.completed
          : [...existing.completed, milestoneId];
        const projectComplete = completed.length >= totalMilestones;
        const awarded = alreadyDone ? 0 : xp;

        set({
          ...roll,
          xp: state.xp + awarded,
          counters: { ...roll.counters, xpToday: roll.counters.xpToday + awarded },
          activity: addToDay(state.activity, today, { xp: awarded }),
          capstones: {
            ...state.capstones,
            [capstoneId]: {
              ...existing,
              completed,
              submissions: { ...existing.submissions, [milestoneId]: submission },
              completedAt:
                projectComplete && !existing.completedAt
                  ? new Date().toISOString()
                  : existing.completedAt,
            },
          },
        });

        return { xpAwarded: awarded, projectComplete };
      },

      hydrateFromServer: (snapshot) =>
        set((state) => ({
          // Local wins on conflict: the learner's device has the freshest data,
          // and the server copy may be minutes behind.
          ...state,
          ...snapshot,
          xp: Math.max(state.xp, snapshot.xp ?? 0),
          gems: Math.max(state.gems, snapshot.gems ?? 0),
          longestStreak: Math.max(state.longestStreak, snapshot.longestStreak ?? 0),
          lessons: { ...(snapshot.lessons ?? {}), ...state.lessons },
          challenges: { ...(snapshot.challenges ?? {}), ...state.challenges },
          activity: trimActivity({ ...(snapshot.activity ?? {}), ...state.activity }),
          unlockedAchievements: Array.from(
            new Set([
              ...(snapshot.unlockedAchievements ?? []),
              ...state.unlockedAchievements,
            ]),
          ),
          hasHydrated: true,
        })),

      markSynced: () => set({ lastSyncedAt: new Date().toISOString() }),

      resetProgress: () => set({ ...initialState(), hasHydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // `hasHydrated` and `combo` are session-scoped, never persisted.
      partialize: ({ hasHydrated: _h, combo: _c, ...rest }) => rest,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/* --------------------------------------------------------------- selectors */

/**
 * Selectors must return a *stable reference*.
 *
 * Zustand v5 feeds the selector result straight into `useSyncExternalStore`,
 * which compares snapshots with `Object.is`. A selector that allocates — e.g.
 * `(s) => getLevelProgress(s.xp)` — is never equal to its previous result, so
 * React re-renders forever and throws "Maximum update depth exceeded".
 *
 * The rule for this file: select primitives or existing state references only,
 * and derive anything computed *outside* the selector, memoised on those
 * primitives.
 */
export function useLevel(): LevelProgress {
  const xp = useProgressStore((s) => s.xp);
  return React.useMemo(() => getLevelProgress(xp), [xp]);
}

export function useHearts(): HeartSnapshot {
  const hearts = useProgressStore((s) => s.hearts);
  const updatedAt = useProgressStore((s) => s.heartsUpdatedAt);
  return regenerateHearts({ hearts, updatedAt });
}

export function useCompletedLessonIds(): Set<string> {
  const lessons = useProgressStore((s) => s.lessons);
  return new Set(
    Object.entries(lessons)
      .filter(([, l]) => l.status === "completed")
      .map(([id]) => id),
  );
}

export function useDailyQuests(): QuestState[] {
  const day = useProgressStore((s) => s.countersDay);
  const counters = useProgressStore((s) => s.counters);
  const today = localDayKey();
  // Counters roll over lazily on the next write, so read through the day check.
  return evaluateQuests(questsForDay(today), day === today ? counters : emptyCounters());
}

export function useAchievementSnapshot(): AchievementSnapshot {
  // Subscribing to the whole state is safe here — the state object's identity
  // only changes when something actually changed — whereas a selector that
  // built the snapshot inline would allocate on every call. See `useLevel`.
  const state = useProgressStore();
  return React.useMemo(() => snapshotFor(state), [state]);
}

/** Server-syncable slice — deliberately excludes transient session state. */
export function serialisableProgress(state: ProgressState) {
  return {
    xp: state.xp,
    gems: state.gems,
    hearts: state.hearts,
    heartsUpdatedAt: state.heartsUpdatedAt,
    streak: state.streak,
    longestStreak: state.longestStreak,
    lastActiveDay: state.lastActiveDay,
    dailyGoal: state.dailyGoal,
    lessons: state.lessons,
    challenges: state.challenges,
    unlockedAchievements: state.unlockedAchievements,
    activity: state.activity,
    playgroundQueriesRun: state.playgroundQueriesRun,
    datasetsExplored: state.datasetsExplored,
    perfectLessons: state.perfectLessons,
    noHintLessons: state.noHintLessons,
    bossesDefeated: state.bossesDefeated,
    tracksCompleted: state.tracksCompleted,
    capstones: state.capstones,
  };
}
