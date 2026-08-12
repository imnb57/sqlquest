import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Container health probe.
 *
 * Reports "ok" whenever the app can serve traffic. A missing or unreachable
 * database is reported as degraded rather than unhealthy, because the whole
 * learning experience works without one — failing the probe would take a
 * perfectly usable deployment out of rotation.
 */
export async function GET() {
  const checks: Record<string, string> = { app: "ok" };
  let database: "ok" | "unreachable" | "not-configured" = "not-configured";

  if (isDatabaseConfigured && db) {
    try {
      await db.execute(sql`SELECT 1`);
      database = "ok";
    } catch {
      database = "unreachable";
    }
  }
  checks.database = database;

  return NextResponse.json(
    {
      status: "ok",
      degraded: database === "unreachable",
      checks,
      version: process.env.npm_package_version ?? "1.0.0",
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
