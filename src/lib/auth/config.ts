import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { z } from "zod";

/**
 * Auth configuration split into an edge-safe half (this file — no database,
 * no bcrypt) and a Node-only half (`./index.ts`). Middleware imports only this
 * one, which keeps the edge bundle small and free of native dependencies.
 */

export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24)
    .regex(/^[a-z0-9_]+$/i, "Letters, numbers and underscores only"),
});

export const oauthProviders = {
  github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
} as const;

export const hasOAuth = oauthProviders.github || oauthProviders.google;

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
    error: "/login",
  },
  session: {
    // Credentials sign-in requires JWT sessions.
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  trustHost: true,
  providers: [
    ...(oauthProviders.github
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(oauthProviders.google
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    // The real authorize() lives in the Node-only config; declaring the
    // provider here keeps the two configs structurally identical.
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: () => null,
    }),
  ],
  callbacks: {
    /*
     * There is deliberately no route-level gating.
     *
     * The entire experience — lessons, dashboard, settings, stats — works
     * signed out, because progress lives in the browser. Redirecting a guest
     * away from /dashboard would contradict that, and would lock people out
     * of the screen where hearts are turned off.
     *
     * Authorisation that actually matters is enforced server-side in the route
     * handlers (`/api/progress`, `/api/profile`), which call `auth()` and
     * return 401 without a session. That's the boundary a user can't bypass;
     * a redirect is only ever cosmetic.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string | null }).username ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
