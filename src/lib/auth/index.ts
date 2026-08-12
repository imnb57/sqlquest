import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db, schema } from "@/db";
import { authConfig, credentialsSchema } from "./config";

/**
 * Node-only auth entry point. Adds the database adapter and the real
 * credentials `authorize()` implementation on top of the edge-safe config.
 */

const adapter = db
  ? DrizzleAdapter(db, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    })
  : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  providers: [
    // Replace the placeholder credentials provider from the shared config.
    ...authConfig.providers.filter((p) => {
      const id = "id" in p ? p.id : undefined;
      return id !== "credentials";
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        if (!db) return null;

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const found = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email.toLowerCase()))
          .limit(1);

        const user = found[0];
        // Hash a dummy value when the account is missing so the response time
        // doesn't reveal whether an email is registered.
        const hash = user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
        const ok = await bcrypt.compare(password, hash);
        if (!user?.passwordHash || !ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
        };
      },
    }),
  ],
});

export const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Convenience for server components: the signed-in user, or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
