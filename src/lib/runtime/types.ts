/**
 * The exercise runtime interface.
 *
 * Everything that makes SQLQuest work — the lesson player, capstone
 * workspace, grading, progress, XP — is already domain-agnostic. Exactly three
 * things are not: booting an engine, loading a fixture, and deciding whether a
 * submission is correct. This interface is those three things.
 *
 * The SQL runtime (PGlite) implements it today. Python/pandas (Pyodide),
 * big-data (DuckDB-WASM) and diagram exercises are expected to implement the
 * same shape — see ROADMAP.md. The pattern that makes this credible is that
 * every candidate runtime is *also* a WASM module in a Web Worker, so the
 * boot/timeout/terminate machinery in `lib/sql/client.ts` transfers directly.
 *
 * Nothing consumes this yet. It exists to pin the contract down *before* a
 * second vertical's worth of content is written against a SQL-shaped model,
 * because that migration gets expensive fast.
 */

export type RuntimeId = "sql" | "python" | "duckdb" | "diagram";

/** A tabular result. Deliberately the lowest common denominator: SQL rows,
 *  a pandas DataFrame and a DuckDB relation all project onto this. */
export interface RuntimeResult {
  columns: { name: string; typeHint?: string }[];
  rows: (string | number | boolean | null)[][];
  /** Anything the runtime printed — stdout for Python, notices for Postgres. */
  output?: string;
  durationMs: number;
  truncated: boolean;
  /** Runtime-specific extras: affected rows, a plan tree, a figure. */
  meta?: Record<string, unknown>;
}

export interface RuntimeError {
  message: string;
  /** SQLSTATE, Python exception class, etc. */
  code?: string;
  /** 1-indexed line in the submission, when the runtime reports one. */
  line?: number;
  hint?: string;
}

/** The seed for an exercise: a SQL script, a CSV + DataFrame setup, a schema. */
export interface RuntimeFixture {
  id: string;
  /** Source the runtime executes to reach its starting state. */
  setup: string;
  /** Optional binary payloads (a parquet file, a model, an image). */
  assets?: Record<string, Uint8Array>;
}

export type GradeVerdict =
  | "correct"
  | "wrong-shape"
  | "wrong-values"
  | "wrong-order"
  | "empty"
  | "constraint"
  | "error";

export interface RuntimeGrade {
  verdict: GradeVerdict;
  correct: boolean;
  message: string;
  hint?: string;
  actual?: RuntimeResult;
  expected?: RuntimeResult;
  /** Row indices that differ, for the diff view. */
  diffRows?: number[];
}

export interface GradeConstraints {
  /** Regexes the submission must match — "solve it with a JOIN". */
  mustUse?: { pattern: string; label: string }[];
  mustNotUse?: { pattern: string; label: string }[];
  orderMatters?: boolean;
  checkColumnNames?: boolean;
}

/**
 * A language/engine that can run and grade exercises.
 *
 * Implementations are expected to be stateful and long-lived: boot once per
 * session, swap fixtures per lesson.
 */
export interface ExerciseRuntime {
  readonly id: RuntimeId;
  /** Shown in the UI: "PostgreSQL 17 (WASM)", "Python 3.12 + pandas". */
  readonly label: string;

  /** Idempotent. Safe to call on every mount. */
  boot(): Promise<void>;

  /** Loads (or reloads) the exercise's starting state. */
  loadFixture(fixture: RuntimeFixture): Promise<void>;

  /** Restores the current fixture, discarding anything the learner changed. */
  reset(): Promise<void>;

  /** Executes a submission without grading it — the "Run" button. */
  run(source: string, options?: { rowLimit?: number }): Promise<RuntimeResult>;

  /**
   * Grades by *executing*, never by comparing text.
   *
   * `observe` is for runtimes where the answer is a side effect rather than a
   * return value — a SQL `UPDATE`, a mutated DataFrame — and names the
   * expression used to inspect the resulting state.
   */
  grade(
    submission: string,
    solution: string,
    constraints?: GradeConstraints,
    observe?: string,
  ): Promise<RuntimeGrade>;

  /**
   * Describes the current state for the UI's context panel: tables and
   * columns for SQL, DataFrames and dtypes for pandas, entities for diagrams.
   */
  introspect(): Promise<RuntimeIntrospection>;

  dispose(): void;
}

export interface RuntimeIntrospection {
  /** Named collections: tables, DataFrames, entities. */
  entities: {
    name: string;
    kind: string;
    rowCount?: number;
    fields: {
      name: string;
      type: string;
      nullable?: boolean;
      isKey?: boolean;
      references?: { entity: string; field: string };
    }[];
  }[];
}
