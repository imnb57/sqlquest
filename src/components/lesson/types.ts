import type * as React from "react";
import type { Challenge } from "@/content/types";
import type { SchemaTable } from "@/lib/sql/types";
import type { UseSqlEngine } from "@/hooks/use-sql-engine";

/**
 * Contract between the lesson player and each challenge type.
 *
 * The player owns the Check button and the feedback bar; a challenge only
 * owns its own answer UI and exposes an imperative `check()`. That keeps the
 * shared flow (hearts, XP, combo, animations) in exactly one place instead of
 * being reimplemented per challenge type.
 */

export interface ChallengeCheckResult {
  correct: boolean;
  /**
   * Big text in the feedback bar. Set by the player (varied praise / a gentle
   * nudge) so individual challenge types don't each invent their own voice.
   */
  headline?: string;
  /** Overrides the default feedback headline. */
  message?: string;
  /** Secondary line shown under the headline. */
  hint?: string;
  /** Rich content for the feedback drawer (e.g. a result comparison). */
  detail?: React.ReactNode;
}

export interface ChallengeHandle {
  check: () => Promise<ChallengeCheckResult>;
  /** Called when the learner retries after a wrong answer. */
  reset: () => void;
  /** Reveals the answer — used by the "Skip" affordance. */
  revealAnswer?: () => void;
}

export interface ChallengeViewProps<T extends Challenge = Challenge> {
  challenge: T;
  /** Locked once the answer has been checked. */
  locked: boolean;
  /** Tells the player whether Check should be enabled. */
  onCanCheckChange: (canCheck: boolean) => void;
  engine: UseSqlEngine;
  schema: SchemaTable[];
  /** Number of hints the learner has revealed so far. */
  hintsUsed: number;
}
