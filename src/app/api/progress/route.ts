import { NextResponse } from "next/server";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Progress backup.
 *
 * The browser is authoritative during a session; this endpoint stores a
 * snapshot so progress survives a new device. Both verbs degrade quietly when
 * no database is configured — the client treats a failure as "stay local".
 */

const lessonRecord = z.object({
  status: z.enum(["in_progress", "completed"]),
  bestScore: z.number().int().min(0).max(100),
  attempts: z.number().int().min(0),
  xpEarned: z.number().int().min(0),
  secondsSpent: z.number().int().min(0),
  solved: z.array(z.string()).max(64),
  hintsUsed: z.number().int().min(0),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});

const dayRecord = z.object({
  xp: z.number().int().min(0),
  lessons: z.number().int().min(0),
  challenges: z.number().int().min(0),
  seconds: z.number().int().min(0),
});

const snapshotSchema = z.object({
  xp: z.number().int().min(0).max(10_000_000),
  gems: z.number().int().min(0).max(10_000_000),
  hearts: z.number().int().min(0).max(5),
  heartsUpdatedAt: z.string(),
  streak: z.number().int().min(0).max(100_000),
  longestStreak: z.number().int().min(0).max(100_000),
  lastActiveDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dailyGoal: z.number().int().min(10).max(200),
  lessons: z.record(z.string(), lessonRecord),
  challenges: z.record(
    z.string(),
    z.object({
      attempts: z.number().int().min(0),
      correct: z.boolean(),
      firstTry: z.boolean(),
      hintsUsed: z.number().int().min(0),
      bestMs: z.number().min(0),
    }),
  ),
  unlockedAchievements: z.array(z.string()).max(200),
  activity: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dayRecord),
  playgroundQueriesRun: z.number().int().min(0),
  datasetsExplored: z.array(z.string()).max(50),
  perfectLessons: z.number().int().min(0),
  noHintLessons: z.number().int().min(0),
  bossesDefeated: z.number().int().min(0),
  tracksCompleted: z.array(z.string()).max(50),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!db) return NextResponse.json({ progress: null, persisted: false });

  const userId = session.user.id;

  const [stats, lessonRows, activityRows, achievementRows] = await Promise.all([
    db.select().from(schema.userStats).where(eq(schema.userStats.userId, userId)).limit(1),
    db.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, userId)),
    db.select().from(schema.dailyActivity).where(eq(schema.dailyActivity.userId, userId)),
    db
      .select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, userId)),
  ]);

  const row = stats[0];
  if (!row) return NextResponse.json({ progress: null, persisted: true });

  return NextResponse.json({
    persisted: true,
    progress: {
      xp: row.xp,
      gems: row.gems,
      hearts: row.hearts,
      heartsUpdatedAt: row.heartsUpdatedAt.toISOString(),
      streak: row.streak,
      longestStreak: row.longestStreak,
      lastActiveDay: row.lastActiveDay,
      dailyGoal: row.dailyGoal,
      lessons: Object.fromEntries(
        lessonRows.map((l) => [
          l.lessonId,
          {
            status: l.status,
            bestScore: l.bestScore,
            attempts: l.attempts,
            xpEarned: l.xpEarned,
            secondsSpent: l.secondsSpent,
            solved: [],
            hintsUsed: 0,
            startedAt: l.startedAt.toISOString(),
            completedAt: l.completedAt?.toISOString(),
          },
        ]),
      ),
      challenges: {},
      unlockedAchievements: achievementRows
        .filter((a) => a.unlockedAt)
        .map((a) => a.achievementId),
      activity: Object.fromEntries(
        activityRows.map((a) => [
          a.day,
          {
            xp: a.xpEarned,
            lessons: a.lessonsCompleted,
            challenges: a.challengesSolved,
            seconds: a.secondsPractised,
          },
        ]),
      ),
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!db) {
    return NextResponse.json({ persisted: false, reason: "no-database" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const parsed = snapshotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 422 },
    );
  }

  const userId = session.user.id;
  const s = parsed.data;
  const now = new Date();

  const completedLessons = Object.values(s.lessons).filter(
    (l) => l.status === "completed",
  ).length;
  const solvedChallenges = Object.values(s.challenges).filter((c) => c.correct).length;

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.userStats)
      .values({
        userId,
        xp: s.xp,
        gems: s.gems,
        hearts: s.hearts,
        heartsUpdatedAt: new Date(s.heartsUpdatedAt),
        streak: s.streak,
        longestStreak: s.longestStreak,
        lastActiveDay: s.lastActiveDay,
        dailyGoal: s.dailyGoal,
        totalLessonsCompleted: completedLessons,
        totalChallengesSolved: solvedChallenges,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.userStats.userId,
        set: {
          // Monotonic fields never move backwards, so a stale tab replaying an
          // old snapshot can't wipe out newer progress.
          xp: s.xp,
          gems: s.gems,
          hearts: s.hearts,
          heartsUpdatedAt: new Date(s.heartsUpdatedAt),
          streak: s.streak,
          longestStreak: s.longestStreak,
          lastActiveDay: s.lastActiveDay,
          dailyGoal: s.dailyGoal,
          totalLessonsCompleted: completedLessons,
          totalChallengesSolved: solvedChallenges,
          updatedAt: now,
        },
      });

    const lessonValues = Object.entries(s.lessons).map(([lessonId, l]) => ({
      userId,
      lessonId,
      status: l.status,
      bestScore: l.bestScore,
      attempts: l.attempts,
      xpEarned: l.xpEarned,
      secondsSpent: l.secondsSpent,
      startedAt: new Date(l.startedAt),
      completedAt: l.completedAt ? new Date(l.completedAt) : null,
      updatedAt: now,
    }));

    if (lessonValues.length > 0) {
      await tx
        .insert(schema.lessonProgress)
        .values(lessonValues)
        .onConflictDoUpdate({
          target: [schema.lessonProgress.userId, schema.lessonProgress.lessonId],
          // `excluded` is the row we tried to insert. Referencing the column
          // directly would resolve to the *stored* value and update nothing.
          // Bests are kept with GREATEST so an out-of-order sync can't regress.
          set: {
            status: sql`excluded.status`,
            bestScore: sql`GREATEST(${schema.lessonProgress.bestScore}, excluded.best_score)`,
            attempts: sql`GREATEST(${schema.lessonProgress.attempts}, excluded.attempts)`,
            xpEarned: sql`GREATEST(${schema.lessonProgress.xpEarned}, excluded.xp_earned)`,
            secondsSpent: sql`GREATEST(${schema.lessonProgress.secondsSpent}, excluded.seconds_spent)`,
            completedAt: sql`COALESCE(${schema.lessonProgress.completedAt}, excluded.completed_at)`,
            updatedAt: now,
          },
        });
    }

    const activityValues = Object.entries(s.activity).map(([day, a]) => ({
      userId,
      day,
      xpEarned: a.xp,
      lessonsCompleted: a.lessons,
      challengesSolved: a.challenges,
      secondsPractised: a.seconds,
      goalMet: a.xp >= s.dailyGoal,
    }));

    if (activityValues.length > 0) {
      await tx
        .insert(schema.dailyActivity)
        .values(activityValues)
        .onConflictDoUpdate({
          target: [schema.dailyActivity.userId, schema.dailyActivity.day],
          set: {
            xpEarned: sql`GREATEST(${schema.dailyActivity.xpEarned}, excluded.xp_earned)`,
            lessonsCompleted: sql`GREATEST(${schema.dailyActivity.lessonsCompleted}, excluded.lessons_completed)`,
            challengesSolved: sql`GREATEST(${schema.dailyActivity.challengesSolved}, excluded.challenges_solved)`,
            secondsPractised: sql`GREATEST(${schema.dailyActivity.secondsPractised}, excluded.seconds_practised)`,
            goalMet: sql`${schema.dailyActivity.goalMet} OR excluded.goal_met`,
          },
        });
    }

    if (s.unlockedAchievements.length > 0) {
      const existing = await tx
        .select({ id: schema.userAchievements.achievementId })
        .from(schema.userAchievements)
        .where(
          and(
            eq(schema.userAchievements.userId, userId),
            inArray(schema.userAchievements.achievementId, s.unlockedAchievements),
          ),
        );
      const known = new Set(existing.map((e) => e.id));
      const fresh = s.unlockedAchievements.filter((id) => !known.has(id));

      if (fresh.length > 0) {
        await tx.insert(schema.userAchievements).values(
          fresh.map((achievementId) => ({
            userId,
            achievementId,
            progress: 1,
            unlockedAt: now,
          })),
        );
      }
    }
  });

  return NextResponse.json({ persisted: true, at: now.toISOString() });
}
