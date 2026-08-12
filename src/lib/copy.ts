/**
 * Voice.
 *
 * A learning app that says "Correct!" 237 times in a row starts to feel like a
 * form validator. These rotate so the product reads like a person who is
 * paying attention — praise escalates with a combo, and the encouragement
 * after a wrong answer never scolds.
 *
 * Kept deliberately short and free of exclamation-mark inflation.
 */

const PRAISE_STANDARD = [
  "Correct",
  "That's the one",
  "Exactly right",
  "Nailed it",
  "Spot on",
  "Yes — that works",
  "Clean",
  "Right answer",
];

const PRAISE_COMBO = [
  "Three in a row",
  "You're on a roll",
  "Still going",
  "No stopping you",
];

const PRAISE_HOT = [
  "Unstoppable",
  "This is fluency",
  "You've got this cold",
  "Textbook",
];

const PRAISE_FIRST_TRY_HARD = [
  "First try on a hard one",
  "That was the tricky one",
  "Straight through the hard one",
];

/**
 * Praise scaled to how the learner is doing.
 * `combo` is the run of consecutive correct answers *including* this one.
 */
export function praiseFor(combo: number, wasHard = false): string {
  const pool =
    combo >= 6
      ? PRAISE_HOT
      : combo >= 3
        ? PRAISE_COMBO
        : wasHard
          ? PRAISE_FIRST_TRY_HARD
          : PRAISE_STANDARD;

  return pick(pool);
}

const NUDGE = [
  "Not quite",
  "Close",
  "Almost",
  "Not this time",
  "Nearly there",
];

/** Never "Wrong!" — the feedback underneath does the actual teaching. */
export function nudge(): string {
  return pick(NUDGE);
}

/**
 * Shown while PostgreSQL compiles in the worker. Rotating these turns a
 * multi-second wait into something that reads as deliberate rather than stuck,
 * and each line quietly explains what's actually happening.
 */
export const BOOT_MESSAGES = [
  "Compiling PostgreSQL to WebAssembly…",
  "Starting a database inside your browser tab…",
  "No server involved — this all runs on your machine…",
  "Setting up the tables for this lesson…",
  "Almost there. This only happens once per session…",
];

/** Empty-state copy with a bit of warmth. */
export const EMPTY_STATES = {
  noPractice: {
    title: "Nothing to review yet",
    body: "Finish a lesson and it'll show up here so you can come back to it.",
  },
  noAchievements: {
    title: "No badges yet",
    body: "Solve a single challenge and the first one unlocks. There are 26 to find.",
  },
  noStats: {
    title: "No statistics yet",
    body: "Answer a few challenges and this fills up with accuracy by track, performance by question type, and your activity history.",
  },
  noLeaderboard: {
    title: "Nobody on the board yet",
    body: "Finish a lesson and you'll be first.",
  },
} as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
