import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/**
 * Persistence schema.
 *
 * The app is deliberately usable with no database at all: progress lives in
 * the browser and is synced up when (and only when) someone signs in. These
 * tables are therefore the *durable* copy, not the source of truth during a
 * lesson — which keeps the lesson loop instant and offline-tolerant.
 */

/* ============================================================ Auth.js core */

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
    image: text("image"),

    /** Public handle used for /profile/[username] and the leaderboard. */
    username: varchar("username", { length: 32 }).unique(),
    /** Null for OAuth-only accounts. */
    passwordHash: text("password_hash"),
    bio: varchar("bio", { length: 280 }),
    country: varchar("country", { length: 2 }),
    timezone: text("timezone").default("UTC").notNull(),
    role: text("role").$type<"user" | "admin">().default("user").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_username_lower_idx").on(t.username)],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ========================================================== Gamified state */

export const userStats = pgTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  xp: integer("xp").default(0).notNull(),
  gems: integer("gems").default(50).notNull(),

  /** Hearts regenerate over time; `heartsUpdatedAt` anchors that clock. */
  hearts: smallint("hearts").default(5).notNull(),
  heartsUpdatedAt: timestamp("hearts_updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  streak: integer("streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  /** Local-day key (YYYY-MM-DD) of the learner's last completed activity. */
  lastActiveDay: date("last_active_day"),
  streakFreezes: smallint("streak_freezes").default(0).notNull(),

  /** Daily XP target chosen in settings. */
  dailyGoal: integer("daily_goal").default(50).notNull(),

  totalLessonsCompleted: integer("total_lessons_completed").default(0).notNull(),
  totalChallengesSolved: integer("total_challenges_solved").default(0).notNull(),
  totalSecondsPractised: integer("total_seconds_practised").default(0).notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  theme: text("theme").$type<"light" | "dark" | "system">().default("system").notNull(),
  reducedMotion: boolean("reduced_motion").default(false).notNull(),
  soundEnabled: boolean("sound_enabled").default(true).notNull(),
  hapticsEnabled: boolean("haptics_enabled").default(true).notNull(),

  editorFontSize: smallint("editor_font_size").default(14).notNull(),
  editorKeymap: text("editor_keymap").$type<"default" | "vim">().default("default").notNull(),
  autocompleteEnabled: boolean("autocomplete_enabled").default(true).notNull(),
  /** Show the expected-output grid next to the learner's result on failure. */
  showExpectedOnFail: boolean("show_expected_on_fail").default(true).notNull(),

  publicProfile: boolean("public_profile").default(true).notNull(),
  showOnLeaderboard: boolean("show_on_leaderboard").default(true).notNull(),

  emailProductUpdates: boolean("email_product_updates").default(false).notNull(),
  emailStreakReminders: boolean("email_streak_reminders").default(true).notNull(),
  emailWeeklyDigest: boolean("email_weekly_digest").default(true).notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ================================================================ Progress */

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),

    status: text("status")
      .$type<"in_progress" | "completed">()
      .default("in_progress")
      .notNull(),
    /** Best proportion of challenges solved first-try, 0–100. */
    bestScore: smallint("best_score").default(0).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    secondsSpent: integer("seconds_spent").default(0).notNull(),

    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.lessonId] }),
    index("lesson_progress_user_status_idx").on(t.userId, t.status),
  ],
);

export const challengeAttempts = pgTable(
  "challenge_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    challengeId: text("challenge_id").notNull(),

    correct: boolean("correct").notNull(),
    /** Truncated server-side; only kept for the learner's own review. */
    submission: text("submission"),
    hintsUsed: smallint("hints_used").default(0).notNull(),
    durationMs: integer("duration_ms").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("challenge_attempts_user_idx").on(t.userId, t.createdAt),
    index("challenge_attempts_challenge_idx").on(t.challengeId),
  ],
);

/**
 * One row per learner per local day. This is the table the streak calendar,
 * the activity heatmap and the weekly leaderboard all read from — keeping
 * those queries cheap regardless of how many attempts exist.
 */
export const dailyActivity = pgTable(
  "daily_activity",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),

    xpEarned: integer("xp_earned").default(0).notNull(),
    lessonsCompleted: integer("lessons_completed").default(0).notNull(),
    challengesSolved: integer("challenges_solved").default(0).notNull(),
    secondsPractised: integer("seconds_practised").default(0).notNull(),
    goalMet: boolean("goal_met").default(false).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.day] }),
    index("daily_activity_day_idx").on(t.day),
  ],
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    /** Progress toward a multi-step achievement; equals the goal when earned. */
    progress: integer("progress").default(0).notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);

/**
 * Saved playground queries. Snippets are private by default; making one public
 * gives it a shareable slug.
 */
export const savedQueries = pgTable(
  "saved_queries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    datasetId: text("dataset_id").notNull(),
    sql: text("sql").notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    slug: varchar("slug", { length: 64 }).unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("saved_queries_user_idx").on(t.userId, t.updatedAt)],
);

/**
 * Raw event log, kept deliberately generic so product analytics can evolve
 * without a migration. Nothing here is required for the app to function.
 */
export const activityEvents = pgTable(
  "activity_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_events_name_idx").on(t.name, t.createdAt)],
);

/* ==================================================================== Types */

export type User = typeof users.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type LessonProgressRow = typeof lessonProgress.$inferSelect;
export type DailyActivityRow = typeof dailyActivity.$inferSelect;
export type SavedQuery = typeof savedQueries.$inferSelect;
