import type { GradeOptions } from "@/lib/sql/types";

/* ============================================================== Datasets == */

export interface DatasetTableDoc {
  name: string;
  description: string;
}

export interface Dataset {
  id: string;
  title: string;
  /** One-line pitch shown above the schema panel. */
  description: string;
  /** Idempotent seed script: DROP + CREATE + INSERT. */
  sql: string;
  tables: DatasetTableDoc[];
}

/* ============================================================ Challenges == */

export type Difficulty = "easy" | "medium" | "hard" | "expert";

interface ChallengeBase {
  id: string;
  /** Markdown-lite prompt (supports `code`, **bold**, *italic*, links). */
  prompt: string;
  /** Progressive hints; each costs a small XP nudge to reveal. */
  hints?: string[];
  /** Shown after the learner answers, right or wrong. */
  explanation?: string;
  xp?: number;
  difficulty?: Difficulty;
}

/** Write SQL; graded by executing it against the reference solution. */
export interface QueryChallenge extends ChallengeBase {
  type: "query";
  /** Text pre-filled in the editor. Use `-- comments` to scaffold. */
  starter?: string;
  solution: string;
  grading?: GradeOptions;
  /**
   * For INSERT/UPDATE/DELETE challenges: the SELECT run afterwards to observe
   * the resulting table state. Both submission and solution are compared
   * through this lens.
   */
  verifyQuery?: string;
  /** Optional dataset override for a single challenge. */
  datasetId?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  /** Rendered in a mono font when true — for SQL snippets. */
  code?: boolean;
}

/** Pick one (or several) from a list. */
export interface ChoiceChallenge extends ChallengeBase {
  type: "choice";
  options: ChoiceOption[];
  correct: string[];
  multiple?: boolean;
}

/** Fill the gaps in a SQL statement from a word bank. */
export interface FillBlankChallenge extends ChallengeBase {
  type: "fill-blank";
  /** Template using `___` for each blank, in order. */
  template: string;
  answers: string[];
  /** Extra decoy tokens mixed into the bank. */
  distractors?: string[];
}

/** Drag SQL clauses into the correct execution/authoring order. */
export interface OrderChallenge extends ChallengeBase {
  type: "order";
  /** Correct order, top to bottom. Shuffled for the learner. */
  items: string[];
}

/** Read a query + table and predict what comes back. */
export interface PredictChallenge extends ChallengeBase {
  type: "predict";
  query: string;
  options: ChoiceOption[];
  correct: string[];
}

/** Spot the bug: pick the line that breaks, then see the fix. */
export interface DebugChallenge extends ChallengeBase {
  type: "debug";
  /** Broken SQL, one statement per line. */
  brokenSql: string;
  /** 0-indexed line the learner must select. */
  buggyLine: number;
  fixedSql: string;
}

export type Challenge =
  | QueryChallenge
  | ChoiceChallenge
  | FillBlankChallenge
  | OrderChallenge
  | PredictChallenge
  | DebugChallenge;

export type ChallengeType = Challenge["type"];

/* =============================================================== Lessons == */

/** A short teaching block shown before the challenges begin. */
export interface Concept {
  title: string;
  body: string;
  /** Optional illustrative snippet with its own explanation. */
  example?: { sql: string; caption?: string };
  /** Callout style. */
  tone?: "info" | "tip" | "warning";
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  /** Sub-heading shown on the lesson card + as the SEO description lead. */
  subtitle: string;
  /** Verb-first outcome, e.g. "Filter rows with WHERE". */
  objective: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  datasetId: string;
  concepts: Concept[];
  challenges: Challenge[];
  /** Keywords used for SEO on the public lesson preview page. */
  keywords: string[];
  /** Lesson ids that should be finished first (soft gate). */
  requires?: string[];
  /** Marks a boss/checkpoint node in the skill tree. */
  kind?: "lesson" | "checkpoint" | "boss";
}

export interface Unit {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Tailwind-friendly accent used by the skill-tree section header. */
  accent: string;
  lessons: Lesson[];
}

export interface Track {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  /** Emoji or short glyph shown on cards. */
  glyph: string;
  accent: string;
  outcomes: string[];
  units: Unit[];
}

/* ========================================================== Derived types = */

export interface LessonRef {
  lesson: Lesson;
  unit: Unit;
  track: Track;
  /** Global position across the whole curriculum, used for ordering. */
  index: number;
}

export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 25,
  expert: 40,
};

export function challengeXp(c: Challenge, lessonDifficulty: Difficulty): number {
  return c.xp ?? XP_BY_DIFFICULTY[c.difficulty ?? lessonDifficulty];
}

export function lessonXp(lesson: Lesson): number {
  return lesson.challenges.reduce(
    (sum, c) => sum + challengeXp(c, lesson.difficulty),
    0,
  );
}
