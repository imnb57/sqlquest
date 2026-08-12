/// <reference lib="webworker" />

import type { PGlite } from "@electric-sql/pglite";
import type {
  QueryField,
  QueryResult,
  SchemaColumn,
  SchemaTable,
  SqlError,
  SqlValue,
  WorkerRequest,
  WorkerResponse,
} from "./types";
import { detectKind } from "./statement";

/**
 * Owns the WASM Postgres instance. One instance per worker; the main thread
 * terminates and respawns this worker if a query overruns its time budget.
 */

const DEFAULT_ROW_LIMIT = 500;

let db: PGlite | null = null;
let seededDataset: string | null = null;

/**
 * PGlite is fetched from `/pglite/index.js` — its own published build, served
 * as a static asset — instead of being bundled.
 *
 * Bundling it breaks: PGlite's Emscripten glue locates its 16 MB payload via
 * `new URL("./pglite.wasm", import.meta.url)` and calls a sibling module's
 * `instantiateWasm`, neither of which survives Turbopack's minifier (the
 * symptom is `m.instantiateWasm is not a function` at boot). Loading it
 * untouched means `import.meta.url` is `/pglite/index.js` and the engine finds
 * its `.wasm` and `.data` right beside itself.
 *
 * `public/pglite/` is populated by `scripts/vendor-pglite.mts` on predev/prebuild.
 */
type PGliteModule = typeof import("@electric-sql/pglite");

let pgliteModule: Promise<PGliteModule> | null = null;

function loadPGlite(): Promise<PGliteModule> {
  pgliteModule ??= import(
    /* turbopackIgnore: true */
    /* webpackIgnore: true */
    // @ts-expect-error - a server-absolute URL resolved by the browser at
    // runtime; TypeScript can only resolve bare or relative specifiers.
    "/pglite/index.js"
  ) as Promise<PGliteModule>;
  return pgliteModule;
}

async function getDb(): Promise<PGlite> {
  if (!db) {
    const { PGlite } = await loadPGlite();
    db = await PGlite.create();
    // Belt-and-braces guard: even though the main thread can terminate us,
    // let Postgres cancel obviously pathological queries on its own.
    await db.exec(`
      SET statement_timeout = '8s';
      SET lock_timeout = '2s';
      SET idle_in_transaction_session_timeout = '10s';
      SET datestyle = 'ISO, YMD';
      SET timezone = 'UTC';
      SET extra_float_digits = 0;
    `);
  }
  return db;
}

/* ----------------------------------------------------------- normalisation */

/**
 * PGlite hands back JS values with types that don't survive structuredClone
 * cleanly (BigInt) or that render inconsistently (Date, Buffer). Flatten
 * everything to primitives the UI and the grader can compare directly.
 */
function normalizeValue(v: unknown): SqlValue {
  if (v === null || v === undefined) return null;
  switch (typeof v) {
    case "bigint":
      return Number.isSafeInteger(Number(v)) ? Number(v) : v.toString();
    case "number":
    case "boolean":
    case "string":
      return v as SqlValue;
    default:
      break;
  }
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Uint8Array) {
    return `\\x${Array.from(v, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }
  if (Array.isArray(v)) return `{${v.map((x) => String(normalizeValue(x))).join(",")}}`;
  return JSON.stringify(v);
}

function toSqlError(e: unknown): SqlError {
  if (e && typeof e === "object") {
    const err = e as Record<string, unknown>;
    return {
      message: String(err.message ?? "Query failed"),
      code: typeof err.code === "string" ? err.code : undefined,
      position:
        typeof err.position === "string"
          ? Number(err.position)
          : typeof err.position === "number"
            ? err.position
            : undefined,
      hint: typeof err.hint === "string" ? err.hint : undefined,
      detail: typeof err.detail === "string" ? err.detail : undefined,
    };
  }
  return { message: String(e) };
}

/* ------------------------------------------------------------------ actions */

async function runExec(sql: string, rowLimit: number): Promise<QueryResult> {
  const pg = await getDb();
  const started = performance.now();

  // `exec` runs every statement in the buffer and returns one result each,
  // which is what the playground needs. We surface the last result set.
  const results = await pg.exec(sql, { rowMode: "array" });
  const durationMs = performance.now() - started;

  const last = results.at(-1);
  const rawRows = (last?.rows ?? []) as unknown[][];
  const fields: QueryField[] = (last?.fields ?? []).map((f) => ({
    name: f.name,
    dataTypeID: f.dataTypeID,
  }));

  const truncated = rawRows.length > rowLimit;
  const rows = (truncated ? rawRows.slice(0, rowLimit) : rawRows).map((row) =>
    Array.isArray(row) ? row.map(normalizeValue) : [normalizeValue(row)],
  );

  return {
    fields,
    rows,
    affectedRows: last?.affectedRows ?? 0,
    durationMs: Math.round(durationMs * 100) / 100,
    truncated,
    kind: detectKind(sql),
  };
}

async function runSeed(datasetId: string, sql: string): Promise<void> {
  // Datasets are small; rebuilding from scratch is faster and far simpler
  // than trying to undo whatever the learner did to the previous one.
  if (db) {
    await db.close().catch(() => undefined);
    db = null;
  }
  seededDataset = null;
  const pg = await getDb();
  await pg.exec(sql);
  seededDataset = datasetId;
}

const SCHEMA_QUERY = `
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.ordinal_position,
  COALESCE(pk.is_pk, false)      AS is_pk,
  fk.foreign_table               AS ref_table,
  fk.foreign_column              AS ref_column
FROM information_schema.columns c
LEFT JOIN (
  SELECT kcu.table_name, kcu.column_name, true AS is_pk
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
LEFT JOIN (
  SELECT
    kcu.table_name,
    kcu.column_name,
    ccu.table_name  AS foreign_table,
    ccu.column_name AS foreign_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
) fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
`;

async function runSchema(): Promise<SchemaTable[]> {
  const pg = await getDb();
  const res = await pg.query<Record<string, unknown>>(SCHEMA_QUERY);

  const byTable = new Map<string, SchemaColumn[]>();
  for (const r of res.rows) {
    const table = String(r.table_name);
    const col: SchemaColumn = {
      name: String(r.column_name),
      type: String(r.data_type),
      nullable: r.is_nullable === "YES",
      isPrimaryKey: r.is_pk === true,
      ...(r.ref_table
        ? { references: { table: String(r.ref_table), column: String(r.ref_column) } }
        : {}),
    };
    const list = byTable.get(table);
    if (list) list.push(col);
    else byTable.set(table, [col]);
  }

  const tables: SchemaTable[] = [];
  for (const [name, columns] of byTable) {
    let rowCount = 0;
    try {
      const c = await pg.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM "${name.replace(/"/g, '""')}"`,
      );
      rowCount = Number(c.rows[0]?.n ?? 0);
    } catch {
      rowCount = 0;
    }
    tables.push({ name, columns, rowCount });
  }
  return tables;
}

/* ------------------------------------------------------------------- router */

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const reply = (msg: WorkerResponse) => self.postMessage(msg);

  try {
    switch (req.type) {
      case "init": {
        const pg = await getDb();
        const v = await pg.query<{ version: string }>("SELECT version() AS version");
        reply({
          id: req.id,
          ok: true,
          type: "init",
          version: v.rows[0]?.version ?? "PostgreSQL (PGlite)",
        });
        break;
      }
      case "seed": {
        if (seededDataset !== req.datasetId) await runSeed(req.datasetId, req.sql);
        reply({ id: req.id, ok: true, type: "seed", datasetId: req.datasetId });
        break;
      }
      case "exec": {
        const result = await runExec(req.sql, req.rowLimit ?? DEFAULT_ROW_LIMIT);
        reply({ id: req.id, ok: true, type: "exec", result });
        break;
      }
      case "schema": {
        reply({ id: req.id, ok: true, type: "schema", schema: await runSchema() });
        break;
      }
      case "reset": {
        if (db) await db.close().catch(() => undefined);
        db = null;
        seededDataset = null;
        reply({ id: req.id, ok: true, type: "reset" });
        break;
      }
    }
  } catch (e) {
    reply({ id: req.id, ok: false, error: toSqlError(e) });
  }
});
