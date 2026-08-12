"use client";

import * as React from "react";
import { getSqlEngine, SqlEngineError } from "@/lib/sql/client";
import type { GradeOptions, GradeResult, QueryResult, SchemaTable, SqlError } from "@/lib/sql/types";
import { getDataset } from "@/content/datasets";

/**
 * React binding for the in-browser Postgres engine.
 *
 * Owns three pieces of state the UI cares about — boot status, the current
 * dataset, and the last result — and makes sure a component that unmounts
 * mid-query can't write to a dead tree.
 */

export type EngineStatus = "idle" | "booting" | "seeding" | "ready" | "error";

export interface UseSqlEngine {
  status: EngineStatus;
  error: SqlError | null;
  schema: SchemaTable[];
  result: QueryResult | null;
  isRunning: boolean;
  run: (sql: string) => Promise<QueryResult | null>;
  grade: (
    submission: string,
    solution: string,
    options?: GradeOptions,
    verifyQuery?: string,
  ) => Promise<GradeResult>;
  reset: () => Promise<void>;
  refreshSchema: () => Promise<void>;
}

export function useSqlEngine(datasetId: string): UseSqlEngine {
  const [status, setStatus] = React.useState<EngineStatus>("idle");
  const [error, setError] = React.useState<SqlError | null>(null);
  const [schema, setSchema] = React.useState<SchemaTable[]>([]);
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /* -- boot + seed ------------------------------------------------------- */

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const engine = getSqlEngine();
      setStatus((s) => (s === "ready" ? "seeding" : "booting"));
      setError(null);
      setResult(null);

      try {
        const dataset = getDataset(datasetId);
        await engine.boot();
        if (cancelled) return;
        setStatus("seeding");

        await engine.useDataset(dataset.id, dataset.sql);
        if (cancelled) return;

        const tables = await engine.schema();
        if (cancelled) return;

        setSchema(tables);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof SqlEngineError ? e.sqlError : { message: String(e) });
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  /* -- actions ----------------------------------------------------------- */

  const run = React.useCallback(async (sql: string) => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await getSqlEngine().run(sql);
      if (!alive.current) return null;
      setResult(res);
      return res;
    } catch (e) {
      if (!alive.current) return null;
      const sqlError =
        e instanceof SqlEngineError ? e.sqlError : { message: String(e) };
      setError(sqlError);
      setResult(null);
      return null;
    } finally {
      if (alive.current) setIsRunning(false);
    }
  }, []);

  const grade = React.useCallback(
    async (
      submission: string,
      solution: string,
      options?: GradeOptions,
      verifyQuery?: string,
    ) => {
      setIsRunning(true);
      setError(null);
      try {
        const outcome = await getSqlEngine().grade(
          submission,
          solution,
          options,
          verifyQuery,
        );
        if (alive.current) {
          setResult(outcome.actual ?? null);
          if (outcome.verdict === "error") {
            setError({ message: outcome.message, hint: outcome.hint });
          }
        }
        return outcome;
      } finally {
        if (alive.current) setIsRunning(false);
      }
    },
    [],
  );

  const reset = React.useCallback(async () => {
    setStatus("seeding");
    try {
      await getSqlEngine().resetDataset();
      const tables = await getSqlEngine().schema();
      if (!alive.current) return;
      setSchema(tables);
      setResult(null);
      setError(null);
      setStatus("ready");
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof SqlEngineError ? e.sqlError : { message: String(e) });
      setStatus("error");
    }
  }, []);

  const refreshSchema = React.useCallback(async () => {
    try {
      const tables = await getSqlEngine().schema();
      if (alive.current) setSchema(tables);
    } catch {
      /* Schema is decorative; a failure here shouldn't break the lesson. */
    }
  }, []);

  return {
    status,
    error,
    schema,
    result,
    isRunning,
    run,
    grade,
    reset,
    refreshSchema,
  };
}
