import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Database handle.
 *
 * `DATABASE_URL` is optional on purpose. The whole learning experience works
 * without a server — progress lives in the browser — so a missing connection
 * string degrades to "guest mode" rather than crashing the app. Anything that
 * genuinely needs persistence calls `requireDb()`.
 */

declare global {
   
  var __sqlquestPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

export const isDatabaseConfigured = Boolean(connectionString);

function createPool(url: string): Pool {
  return new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Managed Postgres providers almost always terminate TLS with their own CA.
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

// Reuse the pool across hot reloads in dev, otherwise every edit leaks sockets.
const pool = connectionString
  ? (globalThis.__sqlquestPool ??= createPool(connectionString))
  : undefined;

if (process.env.NODE_ENV !== "production" && pool) {
  globalThis.__sqlquestPool = pool;
}

export const db: NodePgDatabase<typeof schema> | null = pool
  ? drizzle(pool, { schema })
  : null;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "DATABASE_URL is not set. Progress is being kept in this browser only.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/** Use inside route handlers that cannot work without persistence. */
export function requireDb(): NodePgDatabase<typeof schema> {
  if (!db) throw new DatabaseNotConfiguredError();
  return db;
}

export { schema };
