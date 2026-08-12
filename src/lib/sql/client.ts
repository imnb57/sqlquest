import type {
  GradeOptions,
  GradeResult,
  QueryResult,
  SchemaTable,
  SqlError,
  WorkerRequest,
  WorkerResponse,
} from "./types";
import { compareResults } from "./grade";
import { hasOrderBy, isMutating, stripLiteralsAndComments } from "./statement";

/**
 * `Omit` collapses a union into a single object type, which would lose the
 * per-variant fields. Distributing over the union preserves them.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type WorkerRequestPayload = DistributiveOmit<WorkerRequest, "id">;

/** Hard ceiling per request. Overrunning kills and respawns the worker. */
const QUERY_TIMEOUT_MS = 10_000;
const BOOT_TIMEOUT_MS = 45_000;

interface Pending {
  resolve: (value: WorkerResponse) => void;
  reject: (reason: SqlError) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class SqlEngineError extends Error {
  readonly sqlError: SqlError;
  constructor(sqlError: SqlError) {
    super(sqlError.message);
    this.name = "SqlEngineError";
    this.sqlError = sqlError;
  }
}

/**
 * Main-thread handle to the WASM Postgres worker.
 *
 * Requests are correlated by id. If a request overruns its budget we assume
 * the worker's single thread is wedged inside WASM (it cannot be interrupted
 * cooperatively) and terminate it; the next call transparently boots a new one.
 */
export class SqlEngine {
  #worker: Worker | null = null;
  #pending = new Map<number, Pending>();
  #nextId = 1;
  #booted: Promise<void> | null = null;
  #currentDataset: { id: string; sql: string } | null = null;

  #spawn(): Worker {
    const worker = new Worker(new URL("./engine.worker.ts", import.meta.url), {
      type: "module",
      name: "sqlquest-pg",
    });
    worker.addEventListener("message", (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const pending = this.#pending.get(msg.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.#pending.delete(msg.id);
      if (msg.ok) pending.resolve(msg);
      else pending.reject(msg.error);
    });
    worker.addEventListener("error", (e) => {
      this.#failAll({ message: e.message || "The SQL engine crashed." });
    });
    return worker;
  }

  #failAll(error: SqlError) {
    for (const [, p] of this.#pending) {
      clearTimeout(p.timer);
      p.reject(error);
    }
    this.#pending.clear();
  }

  /** Tear the worker down. The dataset is remembered so it can be re-seeded. */
  #kill(reason: SqlError) {
    this.#worker?.terminate();
    this.#worker = null;
    this.#booted = null;
    this.#failAll(reason);
  }

  #send(req: WorkerRequestPayload, timeout = QUERY_TIMEOUT_MS) {
    if (!this.#worker) this.#worker = this.#spawn();
    const id = this.#nextId++;
    const message = { ...req, id } as WorkerRequest;

    return new Promise<WorkerResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        this.#kill({
          message:
            "Query took too long and was cancelled. Try narrowing it down with a WHERE clause or LIMIT.",
          code: "57014",
        });
        reject({
          message:
            "Query took too long and was cancelled. Try narrowing it down with a WHERE clause or LIMIT.",
          code: "57014",
        } satisfies SqlError);
      }, timeout);

      this.#pending.set(id, { resolve, reject, timer });
      this.#worker!.postMessage(message);
    });
  }

  /** Boots Postgres. Safe to call repeatedly; the promise is memoised. */
  boot(): Promise<void> {
    this.#booted ??= this.#send({ type: "init" }, BOOT_TIMEOUT_MS)
      .then(() => undefined)
      .catch((e: SqlError) => {
        this.#booted = null;
        throw new SqlEngineError(e);
      });
    return this.#booted;
  }

  get isBooting(): boolean {
    return this.#booted !== null && this.#worker !== null;
  }

  /** Loads a dataset. No-ops when the same dataset is already resident. */
  async useDataset(datasetId: string, sql: string): Promise<void> {
    await this.boot();
    this.#currentDataset = { id: datasetId, sql };
    try {
      await this.#send({ type: "seed", datasetId, sql }, BOOT_TIMEOUT_MS);
    } catch (e) {
      throw new SqlEngineError(e as SqlError);
    }
  }

  /** Rebuilds the current dataset from scratch, discarding learner mutations. */
  async resetDataset(): Promise<void> {
    if (!this.#currentDataset) return;
    const { id, sql } = this.#currentDataset;
    await this.boot();
    await this.#send({ type: "reset" }, BOOT_TIMEOUT_MS);
    await this.#send({ type: "seed", datasetId: id, sql }, BOOT_TIMEOUT_MS);
  }

  async run(sql: string, rowLimit?: number): Promise<QueryResult> {
    await this.boot();
    try {
      const res = (await this.#send({ type: "exec", sql, rowLimit })) as Extract<
        WorkerResponse,
        { type: "exec" }
      >;
      return res.result;
    } catch (e) {
      // A killed worker loses its data; restore the dataset for the next run.
      if (!this.#worker && this.#currentDataset) {
        void this.useDataset(this.#currentDataset.id, this.#currentDataset.sql).catch(
          () => undefined,
        );
      }
      throw new SqlEngineError(e as SqlError);
    }
  }

  async schema(): Promise<SchemaTable[]> {
    await this.boot();
    try {
      const res = (await this.#send({ type: "schema" })) as Extract<
        WorkerResponse,
        { type: "schema" }
      >;
      return res.schema;
    } catch (e) {
      throw new SqlEngineError(e as SqlError);
    }
  }

  /**
   * Grades a submission by running it and the reference solution against
   * identical database states, then comparing result sets.
   *
   * Nothing is hard-coded: change the dataset and the expected answer moves
   * with it, which keeps the 300+ challenges maintainable.
   */
  async grade(
    submission: string,
    solution: string,
    options: GradeOptions = {},
    /** For DML challenges: the SELECT used to observe the resulting state. */
    verifyQuery?: string,
  ): Promise<GradeResult> {
    const trimmed = submission.trim().replace(/;+\s*$/, "");
    if (!trimmed) {
      return {
        verdict: "empty",
        correct: false,
        message: "Write a query before checking.",
      };
    }

    const constraintFailure = checkConstraints(trimmed, options);
    if (constraintFailure) return constraintFailure;

    const mutating = isMutating(trimmed) || isMutating(solution);
    const observe = verifyQuery ?? null;

    let actual: QueryResult;
    let expected: QueryResult;

    try {
      if (mutating && observe) {
        await this.resetDataset();
        await this.run(trimmed, 1000);
        actual = await this.run(observe, 1000);

        await this.resetDataset();
        await this.run(solution, 1000);
        expected = await this.run(observe, 1000);
        await this.resetDataset();
      } else {
        actual = await this.run(trimmed, 1000);
        expected = await this.run(solution, 1000);
      }
    } catch (e) {
      const err = e instanceof SqlEngineError ? e.sqlError : { message: String(e) };
      return {
        verdict: "error",
        correct: false,
        message: friendlyError(err),
        hint: err.hint ?? errorHint(err),
      };
    }

    const orderMatters = options.orderMatters ?? hasOrderBy(solution);
    return compareResults(actual, expected, {
      orderMatters,
      checkColumnNames: options.checkColumnNames ?? false,
    });
  }

  dispose() {
    this.#kill({ message: "Engine disposed." });
    this.#currentDataset = null;
  }
}

/* --------------------------------------------------------------- constraints */

function checkConstraints(sql: string, options: GradeOptions): GradeResult | null {
  const cleaned = stripLiteralsAndComments(sql);

  for (const rule of options.mustUse ?? []) {
    if (!new RegExp(rule.pattern, "i").test(cleaned)) {
      return {
        verdict: "constraint",
        correct: false,
        message: `This challenge needs you to use ${rule.label}.`,
        hint: "The result might be right, but the goal here is to practise a specific technique.",
      };
    }
  }
  for (const rule of options.mustNotUse ?? []) {
    if (new RegExp(rule.pattern, "i").test(cleaned)) {
      return {
        verdict: "constraint",
        correct: false,
        message: `Try solving this without ${rule.label}.`,
        hint: "There's a cleaner approach that scales better.",
      };
    }
  }
  return null;
}

/* ------------------------------------------------------------ error copy */

/** Rewrites the rawest Postgres messages into something a learner can act on. */
function friendlyError(err: SqlError): string {
  const m = err.message;
  if (/syntax error at or near "(.+)"/.test(m)) {
    const token = m.match(/near "(.+?)"/)?.[1];
    return `Syntax error near \`${token}\`. Check for a missing comma, keyword, or closing parenthesis.`;
  }
  if (/relation "(.+)" does not exist/.test(m)) {
    const t = m.match(/relation "(.+?)"/)?.[1];
    return `There's no table called \`${t}\` in this dataset. Check the schema panel for the exact name.`;
  }
  if (/column "(.+)" does not exist/.test(m)) {
    const c = m.match(/column "(.+?)"/)?.[1];
    return `There's no column called \`${c}\`. Column names are case-sensitive when quoted.`;
  }
  if (/must appear in the GROUP BY clause/.test(m)) {
    return "Every selected column must either be inside an aggregate function or listed in GROUP BY.";
  }
  if (/division by zero/.test(m)) {
    return "Division by zero. Guard the denominator with NULLIF(x, 0).";
  }
  if (/invalid input syntax for type (\w+)/.test(m)) {
    const t = m.match(/type (\w+)/)?.[1];
    return `A value couldn't be read as \`${t}\`. Check quoting and CAST where needed.`;
  }
  return m;
}

function errorHint(err: SqlError): string | undefined {
  switch (err.code) {
    case "42601":
      return "Postgres points at the first token it couldn't parse — the real mistake is usually just before it.";
    case "42P01":
      return "Open the Schema tab to see every table in this dataset.";
    case "42703":
      return "Aliases defined in SELECT can't be reused in WHERE — repeat the expression or wrap the query.";
    case "42803":
      return "Aggregates collapse rows; anything not aggregated has to be grouped.";
    case "57014":
      return "Add a LIMIT while you're experimenting.";
    default:
      return undefined;
  }
}

/* ------------------------------------------------------------- singleton */

let singleton: SqlEngine | null = null;

/** Shared engine so lesson → playground navigation reuses the booted WASM. */
export function getSqlEngine(): SqlEngine {
  if (typeof window === "undefined") {
    throw new Error("The SQL engine is browser-only.");
  }
  singleton ??= new SqlEngine();
  return singleton;
}
