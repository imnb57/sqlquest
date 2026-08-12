import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://sqlquest:sqlquest@localhost:5432/sqlquest",
  },
  verbose: true,
  strict: true,
} satisfies Config;
