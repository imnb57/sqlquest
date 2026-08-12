import { NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { localDayKey } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Weekly XP leaderboard.
 *
 * Reads from `daily_activity`, which is already one row per learner per day,
 * so this stays a single indexed aggregate no matter how many attempts exist.
 * Only learners who opted in are included.
 */

const RANGE_DAYS = { week: 7, month: 30, all: 3650 } as const;
type Range = keyof typeof RANGE_DAYS;

export async function GET(request: Request) {
  if (!db) {
    return NextResponse.json({ available: false, entries: [] });
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const range: Range =
    rangeParam === "month" || rangeParam === "all" ? rangeParam : "week";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 100);

  const since = new Date();
  since.setDate(since.getDate() - RANGE_DAYS[range]);
  const sinceKey = localDayKey(since);

  const rows = await db
    .select({
      userId: schema.dailyActivity.userId,
      name: schema.users.name,
      username: schema.users.username,
      image: schema.users.image,
      country: schema.users.country,
      xp: sql<number>`sum(${schema.dailyActivity.xpEarned})::int`,
      lessons: sql<number>`sum(${schema.dailyActivity.lessonsCompleted})::int`,
      activeDays: sql<number>`count(*)::int`,
    })
    .from(schema.dailyActivity)
    .innerJoin(schema.users, eq(schema.users.id, schema.dailyActivity.userId))
    .leftJoin(
      schema.userSettings,
      eq(schema.userSettings.userId, schema.dailyActivity.userId),
    )
    .where(
      and(
        gte(schema.dailyActivity.day, sinceKey),
        // A missing settings row means defaults, which opt in.
        sql`coalesce(${schema.userSettings.showOnLeaderboard}, true) = true`,
      ),
    )
    .groupBy(
      schema.dailyActivity.userId,
      schema.users.name,
      schema.users.username,
      schema.users.image,
      schema.users.country,
    )
    .orderBy(desc(sql`sum(${schema.dailyActivity.xpEarned})`))
    .limit(limit);

  return NextResponse.json(
    {
      available: true,
      range,
      entries: rows.map((r, i) => ({
        rank: i + 1,
        username: r.username,
        name: r.name,
        image: r.image,
        country: r.country,
        xp: r.xp ?? 0,
        lessons: r.lessons ?? 0,
        activeDays: r.activeDays ?? 0,
      })),
    },
    { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
