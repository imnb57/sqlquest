import type { GradeOptions } from "@/lib/sql/types";
import type { Difficulty } from "./types";

/**
 * Capstone projects.
 *
 * A lesson teaches one idea and tells you exactly what to do. A capstone hands
 * you a business problem, a dataset and a deadline-shaped brief, and expects
 * you to work out the SQL yourself. The difference that matters pedagogically
 * is *framing*: milestones are stated as deliverables ("the finance team needs
 * monthly revenue with month-over-month growth"), not as instructions
 * ("write a query using LAG").
 *
 * Deliberately runtime-agnostic. `language` and `solution` are the only
 * execution-shaped fields, so the same model carries a pandas or a Spark
 * capstone once those runtimes exist — see ROADMAP.md.
 */

export type CapstoneLanguage = "sql";

/** Prose blocks in a brief. Same renderer as the blog, so it stays scannable. */
export type BriefBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: "info" | "tip" | "warning"; title: string; text: string }
  | { type: "code"; sql: string; caption?: string };

/**
 * A pattern the learner will need, surfaced *in* the brief.
 *
 * Capstones assume fluency the reference library doesn't exist to provide yet,
 * so each project carries the handful of techniques it depends on. This is
 * scaffolding, not a walkthrough — it shows the shape, never the answer.
 */
export interface BriefingNote {
  title: string;
  body: string;
  sql?: string;
}

export interface Milestone {
  id: string;
  /** Short label for the stepper. */
  title: string;
  /** What the stakeholder asked for, in their words. */
  brief: string;
  /** The concrete, checkable requirement. */
  task: string;
  solution: string;
  grading?: GradeOptions;
  /** For DML milestones: the SELECT used to observe the resulting state. */
  verifyQuery?: string;
  hints?: string[];
  /** Shown after success — why this step matters in the bigger picture. */
  debrief?: string;
  /**
   * How the result is presented on the deliverables board.
   * `metric` pulls the first cell out as a headline number.
   */
  deliverable?: { label: string; kind: "table" | "metric" };
  xp?: number;
}

export interface Capstone {
  id: string;
  slug: string;
  title: string;
  /** One line, shown on the card. */
  subtitle: string;
  /** The situation: who you are, who's asking, why it matters. */
  scenario: string;
  language: CapstoneLanguage;
  datasetId: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  glyph: string;
  accent: string;
  /** Tracks a learner should have finished first. Advisory, not enforced. */
  requiresTracks: string[];
  /** Bullet list of what they'll walk away with. */
  deliverables: string[];
  /** Long-form context, rendered above the first milestone. */
  brief: BriefBlock[];
  /** Techniques this project leans on, with shape-only examples. */
  briefing: BriefingNote[];
  milestones: Milestone[];
  keywords: string[];
}

export const MILESTONE_XP = 45;

export function capstoneXp(capstone: Capstone): number {
  return capstone.milestones.reduce((sum, m) => sum + (m.xp ?? MILESTONE_XP), 0);
}
