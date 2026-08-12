"use client";

import * as React from "react";
import { AlertTriangle, Clock, Database, Rows3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/stores/settings-store";
import type { QueryResult, SqlError, SqlValue } from "@/lib/sql/types";

/**
 * Result table.
 *
 * Renders up to a few hundred rows; anything larger is already truncated by
 * the engine. Numeric columns are right-aligned and NULLs are rendered
 * distinctly, because "empty string vs NULL" is exactly the distinction
 * learners are being taught to notice.
 */

/** Postgres type OIDs that should be right-aligned. */
const NUMERIC_OIDS = new Set([20, 21, 23, 26, 700, 701, 1700]);

function Cell({ value, numeric }: { value: SqlValue; numeric: boolean }) {
  if (value === null) {
    return (
      <span className="text-xs font-bold tracking-wide text-fg-subtle uppercase italic">
        null
      </span>
    );
  }
  if (typeof value === "boolean") {
    return (
      <span className={value ? "font-bold text-success" : "font-bold text-danger"}>
        {String(value)}
      </span>
    );
  }
  if (value === "") {
    return <span className="text-xs text-fg-subtle italic">empty</span>;
  }
  return <span className={numeric ? "tabular-nums" : undefined}>{String(value)}</span>;
}

export interface ResultGridProps {
  result: QueryResult | null;
  error?: SqlError | null;
  /** Row indices to highlight as differing from the expected output. */
  diffRows?: number[];
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
  /** Compact chrome for the side-by-side expected/actual comparison. */
  dense?: boolean;
}

export function ResultGrid({
  result,
  error,
  diffRows,
  emptyMessage = "Run a query to see results here.",
  className,
  maxHeight = "22rem",
  dense,
}: ResultGridProps) {
  const density = useSettingsStore((s) => s.resultDensity);
  const compact = dense || density === "compact";
  const diff = React.useMemo(() => new Set(diffRows ?? []), [diffRows]);

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-xl border-2 border-danger/35 bg-danger/8 p-4",
          className,
        )}
      >
        <p className="flex items-start gap-2.5 text-sm font-bold text-danger">
          <AlertTriangle className="mt-0.5 size-4.5 shrink-0" />
          <span className="min-w-0">{error.message}</span>
        </p>
        {error.hint && (
          <p className="mt-2 pl-7 text-sm leading-relaxed text-fg-muted">
            {error.hint}
          </p>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-xl border-2 border-dashed border-border-base p-8 text-center",
          className,
        )}
      >
        <div>
          <Database className="mx-auto size-7 text-fg-subtle" />
          <p className="mt-2 text-sm text-fg-muted">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const hasColumns = result.fields.length > 0;

  // INSERT/UPDATE/DELETE report affected rows rather than a result set.
  if (!hasColumns) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-success/35 bg-success/8 p-4 text-sm font-bold text-success",
          className,
        )}
      >
        Statement completed · {result.affectedRows} row
        {result.affectedRows === 1 ? "" : "s"} affected
        <span className="ml-2 font-semibold text-fg-muted">
          ({result.durationMs} ms)
        </span>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border-base", className)}>
      <div className="overflow-auto scroll-thin" style={{ maxHeight }}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {result.fields.map((field) => (
                <th
                  key={field.name}
                  scope="col"
                  className={cn(
                    "border-b border-border-strong bg-bg-subtle px-3 text-left font-extrabold whitespace-nowrap",
                    compact ? "py-1.5 text-xs" : "py-2.5 text-xs",
                    NUMERIC_OIDS.has(field.dataTypeID) && "text-right",
                  )}
                >
                  {field.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={result.fields.length}
                  className="px-3 py-8 text-center text-sm text-fg-muted"
                >
                  Query ran successfully but returned no rows.
                </td>
              </tr>
            ) : (
              result.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-border-base last:border-b-0",
                    diff.has(rowIndex)
                      ? "bg-danger/8"
                      : rowIndex % 2 === 1 && "bg-bg-subtle/45",
                  )}
                >
                  {row.map((value, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn(
                        "px-3 align-top whitespace-nowrap",
                        compact ? "py-1" : "py-2",
                        NUMERIC_OIDS.has(result.fields[colIndex]?.dataTypeID ?? 0) &&
                          "text-right",
                      )}
                    >
                      <Cell
                        value={value}
                        numeric={NUMERIC_OIDS.has(
                          result.fields[colIndex]?.dataTypeID ?? 0,
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-base bg-bg-subtle px-3 py-2 text-xs font-semibold text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <Rows3 className="size-3.5" />
          {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {result.durationMs} ms
        </span>
        {result.truncated && (
          <Badge variant="warning" size="sm">
            Showing first {result.rows.length}
          </Badge>
        )}
      </div>
    </div>
  );
}

/** Side-by-side comparison shown after a wrong answer. */
export function ResultComparison({
  actual,
  expected,
  diffRows,
  className,
}: {
  actual: QueryResult | null;
  expected: QueryResult | null;
  diffRows?: number[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <div>
        <p className="mb-1.5 eyebrow text-danger">
          Your result
        </p>
        <ResultGrid result={actual} diffRows={diffRows} dense maxHeight="15rem" />
      </div>
      <div>
        <p className="mb-1.5 eyebrow text-success">
          Expected
        </p>
        <ResultGrid result={expected} dense maxHeight="15rem" />
      </div>
    </div>
  );
}
