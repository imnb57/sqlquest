"use client";

import * as React from "react";
import { ChevronRight, KeyRound, Link2, Table2 } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import { Tooltip } from "@/components/ui/overlays";
import type { SchemaTable } from "@/lib/sql/types";

/**
 * Live schema browser.
 *
 * Read from `information_schema` inside the WASM instance rather than from the
 * dataset definition, so it always reflects the database the learner is
 * actually querying — including tables they just created themselves.
 */

/** Trims Postgres' verbose type names down to something readable. */
function shortType(type: string): string {
  return type
    .replace("character varying", "varchar")
    .replace("timestamp without time zone", "timestamp")
    .replace("timestamp with time zone", "timestamptz")
    .replace("double precision", "float8")
    .replace("boolean", "bool")
    .replace("integer", "int");
}

function TableCard({
  table,
  defaultOpen,
  onInsert,
}: {
  table: SchemaTable;
  defaultOpen?: boolean;
  onInsert?: (text: string) => void;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);

  return (
    <div className="overflow-hidden rounded-xl border border-border-base">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 bg-bg-subtle px-3 py-2.5 text-left transition-colors hover:bg-bg-inset"
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-fg-subtle transition-transform",
            open && "rotate-90",
          )}
        />
        <Table2 className="size-4 shrink-0 text-brand-500" />
        <span className="flex-1 truncate font-mono text-sm font-bold">
          {table.name}
        </span>
        <span className="text-xs font-semibold tabular-nums text-fg-subtle">
          {formatNumber(table.rowCount)}
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-border-base">
          {table.columns.map((col) => (
            <li
              key={col.name}
              className="flex items-center gap-2 px-3 py-1.5 text-xs"
            >
              {col.isPrimaryKey ? (
                <Tooltip label="Primary key">
                  <KeyRound className="size-3.5 shrink-0 text-xp-dark dark:text-xp" />
                </Tooltip>
              ) : col.references ? (
                <Tooltip
                  label={`References ${col.references.table}.${col.references.column}`}
                >
                  <Link2 className="size-3.5 shrink-0 text-aqua-500" />
                </Tooltip>
              ) : (
                <span className="size-3.5 shrink-0" />
              )}

              <button
                type="button"
                onClick={() => onInsert?.(col.name)}
                disabled={!onInsert}
                className={cn(
                  "min-w-0 flex-1 truncate text-left font-mono font-semibold",
                  onInsert && "hover:text-brand-500",
                )}
                title={onInsert ? "Click to insert" : undefined}
              >
                {col.name}
              </button>

              <span className="shrink-0 font-mono text-xs text-fg-subtle">
                {shortType(col.type)}
                {!col.nullable && (
                  <span className="ml-1 text-danger" title="NOT NULL">
                    *
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SchemaPanel({
  schema,
  className,
  onInsert,
  loading,
}: {
  schema: SchemaTable[];
  className?: string;
  onInsert?: (text: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-11 rounded-xl bg-bg-inset shimmer" />
        ))}
      </div>
    );
  }

  if (schema.length === 0) {
    return (
      <p className={cn("px-1 py-6 text-center text-sm text-fg-muted", className)}>
        No tables in this database yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {schema.map((table, i) => (
        <TableCard
          key={table.name}
          table={table}
          defaultOpen={schema.length <= 2 || i === 0}
          onInsert={onInsert}
        />
      ))}
      <p className="px-1 pt-1 text-xs leading-relaxed text-fg-subtle">
        <span className="text-danger">*</span> marks NOT NULL columns. Keys and
        foreign keys are flagged with icons.
      </p>
    </div>
  );
}
