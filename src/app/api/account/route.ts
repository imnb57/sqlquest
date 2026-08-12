import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteSchema = z.object({
  /** The account's own email, retyped. Proves intent server-side, not just in the UI. */
  confirmEmail: z.string().email(),
});

/**
 * Permanently deletes the signed-in account.
 *
 * Every table that references `users.id` declares `ON DELETE CASCADE`, so a
 * single row delete removes progress, activity, achievements, saved queries,
 * OAuth links and sessions with it. That's deliberate: a deletion endpoint
 * that has to remember to clean up eight tables is a deletion endpoint that
 * will eventually miss one.
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!db) {
    return NextResponse.json(
      { error: "no-database", message: "This deployment has no database." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-payload", message: "Confirmation email is required." },
      { status: 422 },
    );
  }

  const userId = session.user.id;

  const found = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const account = found[0];
  if (!account) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  // Compare against the stored address, not the one in the session token —
  // a stale token must not be able to authorise deleting a renamed account.
  if (
    account.email?.toLowerCase().trim() !==
    parsed.data.confirmEmail.toLowerCase().trim()
  ) {
    return NextResponse.json(
      { error: "confirmation-mismatch", message: "That email doesn't match this account." },
      { status: 400 },
    );
  }

  await db.delete(schema.users).where(eq(schema.users.id, userId));

  return NextResponse.json({ ok: true, deleted: true });
}
