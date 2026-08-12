"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { KeyRound, Link2, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ErdTable } from "@/lib/erd/types";

/**
 * A table on the canvas.
 *
 * Every column carries its own pair of connection handles, so a foreign key
 * draws from the exact column to the exact column it references — which is the
 * whole point of an ERD, and the thing generic box-and-arrow tools get wrong.
 * Handles are visually hidden until you hover, otherwise the node is a mess of
 * dots.
 */

export type TableNodeData = { table: ErdTable; selected?: boolean };

function TableNodeComponent({ data, selected }: NodeProps) {
  const { table } = data as unknown as TableNodeData;

  return (
    <div
      className={cn(
        "min-w-56 overflow-hidden rounded-xl border-2 bg-bg-elevated shadow-lg transition-shadow",
        selected
          ? "border-brand-500 shadow-brand-500/25"
          : "border-border-strong hover:shadow-xl",
      )}
    >
      {/* Header — also the drag handle */}
      <div
        className={cn(
          "flex items-center gap-2 border-b-2 px-3 py-2",
          selected
            ? "border-brand-500 bg-brand-500/12"
            : "border-border-base bg-bg-subtle",
        )}
      >
        <Table2 className="size-4 shrink-0 text-brand-500" />
        <span className="min-w-0 flex-1 truncate font-mono text-sm font-extrabold">
          {table.name}
        </span>
        <span className="shrink-0 text-xs font-bold tabular-nums text-fg-subtle">
          {table.columns.length}
        </span>
      </div>

      <ul className="divide-y divide-border-base">
        {table.columns.map((column) => (
          <li
            key={column.id}
            className="group relative flex items-center gap-2 px-3 py-1.5 text-xs"
          >
            {/* Target on the left, source on the right — matches the reading
                direction of "child references parent". */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${column.id}-target`}
              className="!size-2 !border-2 !border-bg-elevated !bg-brand-500 !opacity-0 transition-opacity group-hover:!opacity-100"
            />

            {column.isPrimaryKey ? (
              <KeyRound className="size-3 shrink-0 text-xp-dark dark:text-xp" />
            ) : column.references ? (
              <Link2 className="size-3 shrink-0 text-aqua-500" />
            ) : (
              <span className="size-3 shrink-0" />
            )}

            <span
              className={cn(
                "min-w-0 flex-1 truncate font-mono",
                column.isPrimaryKey ? "font-extrabold" : "font-semibold",
              )}
            >
              {column.name}
            </span>

            <span className="shrink-0 font-mono text-[0.6875rem] text-fg-subtle">
              {column.type}
              {!column.isNullable && !column.isPrimaryKey && (
                <span className="ml-0.5 text-danger" title="NOT NULL">
                  *
                </span>
              )}
            </span>

            <Handle
              type="source"
              position={Position.Right}
              id={`${column.id}-source`}
              className="!size-2 !border-2 !border-bg-elevated !bg-aqua-500 !opacity-0 transition-opacity group-hover:!opacity-100"
            />
          </li>
        ))}

        {table.columns.length === 0 && (
          <li className="px-3 py-3 text-center text-xs text-fg-subtle italic">
            No columns yet
          </li>
        )}
      </ul>
    </div>
  );
}

export const TableNode = React.memo(TableNodeComponent);
