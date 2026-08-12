import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";

import { db, schema } from "@/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/auth/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Account creation.
 *
 * Deliberately minimal: email, password, display name and a handle. Progress
 * made as a guest is uploaded by the client immediately after sign-in, so
 * there's nothing to migrate here.
 */
export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json(
      {
        error: "no-database",
        message:
          "Accounts need a database. This deployment is running without one — your progress is still saved in this browser.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-payload",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const username = parsed.data.username.toLowerCase().trim();

  const existing = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(or(eq(schema.users.email, email), eq(schema.users.username, username)))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      {
        error: "already-exists",
        message:
          existing[0].email === email
            ? "An account with that email already exists."
            : "That username is taken.",
      },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      username,
      name: parsed.data.name.trim(),
      passwordHash,
    })
    .returning({ id: schema.users.id });

  // Seed the satellite rows so later upserts always have something to target.
  await Promise.all([
    db.insert(schema.userStats).values({ userId: user.id }).onConflictDoNothing(),
    db.insert(schema.userSettings).values({ userId: user.id }).onConflictDoNothing(),
  ]);

  return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
}
