import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/, "Letters, numbers and underscores only")
    .optional(),
  bio: z.string().max(280).optional(),
  country: z.string().length(2).optional(),
});

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-payload",
        message: parsed.error.issues[0]?.message,
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const userId = session.user.id;
  const { username, ...rest } = parsed.data;

  if (username) {
    const taken = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.username, username), ne(schema.users.id, userId)))
      .limit(1);

    if (taken.length > 0) {
      return NextResponse.json(
        { error: "username-taken", message: "That username is already taken." },
        { status: 409 },
      );
    }
  }

  await db
    .update(schema.users)
    .set({ ...rest, ...(username ? { username } : {}), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));

  return NextResponse.json({ ok: true });
}
