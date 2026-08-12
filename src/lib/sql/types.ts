/**
 * Shared types for the in-browser SQL engine.
 *
 * Every learner query runs against a real PostgreSQL instance compiled to
 * WebAssembly (PGlite) inside a dedicated Web Worker, so:
 *   - the UI thread never blocks on a slow query,
 *   - a runaway query can be killed by terminating the worker,
 *   - nothing the learner writes ever reaches a server.
 */

export type SqlValue = string | number | boolean | null;

export interface QueryField {
  name: string;
  /** Postgres type OID, useful for right-aligning numerics in the grid. */
  dataTypeID: number;
}

export interface QueryResult {
  fields: QueryField[];
  rows: SqlValue[][];
  /** Rows the statement reported as affected (INSERT/UPDATE/DELETE). */
  affectedRows: number;
  /** Wall-clock duration inside the worker, in milliseconds. */
  durationMs: number;
  /** True when the result set was cut off by the row limit. */
  truncated: boolean;
  /** The statement kind we detected, used to pick the right UI affordance. */
  kind: StatementKind;
}

export type StatementKind =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "ddl"
  | "explain"
  | "other";

export interface SqlError {
  message: string;
  /** Postgres SQLSTATE, e.g. "42601" for syntax error. */
  code?: string;
  position?: number;
  hint?: string;
  detail?: string;
}

/* ------------------------------------------------------------------ Protocol */

export type WorkerRequest =
  | { id: number; type: "init" }
  | { id: number; type: "seed"; datasetId: string; sql: string }
  | { id: number; type: "exec"; sql: string; rowLimit?: number }
  | { id: number; type: "schema" }
  | { id: number; type: "reset" };

export type WorkerResponse =
  | { id: number; ok: true; type: "init"; version: string }
  | { id: number; ok: true; type: "seed"; datasetId: string }
  | { id: number; ok: true; type: "exec"; result: QueryResult }
  | { id: number; ok: true; type: "schema"; schema: SchemaTable[] }
  | { id: number; ok: true; type: "reset" }
  | { id: number; ok: false; error: SqlError };

/* -------------------------------------------------------------- Schema model */

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  references?: { table: string; column: string };
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  rowCount: number;
}

/* ------------------------------------------------------------- Grading model */

export interface GradeOptions {
  /**
   * When true the learner's row order must match the reference exactly.
   * Inferred from the presence of ORDER BY in the reference solution unless
   * explicitly set by the challenge author.
   */
  orderMatters?: boolean;
  /** Require the learner's column aliases to match the reference. */
  checkColumnNames?: boolean;
  /** Regexes the submission must match (e.g. force a JOIN over a subquery). */
  mustUse?: { pattern: string; label: string }[];
  /** Regexes the submission must NOT match (e.g. ban hardcoded answers). */
  mustNotUse?: { pattern: string; label: string }[];
}

export type GradeVerdict =
  | "correct"
  | "wrong-rows"
  | "wrong-columns"
  | "wrong-order"
  | "empty"
  | "constraint"
  | "error";

export interface GradeResult {
  verdict: GradeVerdict;
  correct: boolean;
  /** Learner-facing explanation of what went wrong. */
  message: string;
  /** Extra nudge shown under the message. */
  hint?: string;
  actual?: QueryResult;
  expected?: QueryResult;
  /** Row indices that differ, for highlighting in the diff grid. */
  diffRows?: number[];
}
