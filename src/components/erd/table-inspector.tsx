"use client";

import * as React from "react";
import { GripVertical, KeyRound, Plus, Trash2, Unlink } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Checkbox } from "@/components/ui/form-controls";
import { Tooltip } from "@/components/ui/overlays";
import {
  COMMON_TYPES,
  newColumn,
  type ErdColumn,
  type ErdDiagram,
  type ErdTable,
} from "@/lib/erd/types";

/**
 * Property panel for the selected table.
 *
 * Every edit is a whole-table replacement rather than a granular mutation —
 * with tables this size the copy is free, and it keeps undo (a stack of
 * diagram snapshots) trivial to reason about.
 */
export function TableInspector({
  diagram,
  table,
  onChange,
  onDelete,
}: {
  diagram: ErdDiagram;
  table: ErdTable;
  onChange: (next: ErdTable) => void;
  onDelete: () => void;
}) {
  const update = (patch: Partial<ErdTable>) => onChange({ ...table, ...patch });

  const updateColumn = (columnId: string, patch: Partial<ErdColumn>) =>
    update({
      columns: table.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)),
    });

  const removeColumn = (columnId: string) =>
    update({ columns: table.columns.filter((c) => c.id !== columnId) });

  const moveColumn = (index: number, delta: number) => {
    const next = [...table.columns];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ columns: next });
  };

  const otherTables = diagram.tables.filter((t) => t.id !== table.id);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-base p-4">
        <Label htmlFor="table-name">Table name</Label>
        <Input
          id="table-name"
          value={table.name}
          onChange={(e) => update({ name: e.target.value })}
          className="mt-1.5 font-mono"
        />

        <Label htmlFor="table-note" className="mt-3 block">
          Note
        </Label>
        <Input
          id="table-note"
          value={table.note ?? ""}
          onChange={(e) => update({ note: e.target.value || undefined })}
          placeholder="Optional — becomes a SQL comment"
          className="mt-1.5"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="eyebrow text-fg-subtle">Columns</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => update({ columns: [...table.columns, newColumn()] })}
          >
            <Plus />
            Add
          </Button>
        </div>

        <ul className="space-y-3 px-4 pb-4">
          {table.columns.map((column, index) => (
            <li
              key={column.id}
              className="rounded-xl border border-border-base bg-bg-subtle p-3"
            >
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label={`Move ${column.name} up`}
                    onClick={() => moveColumn(index, -1)}
                    disabled={index === 0}
                    className="text-fg-subtle hover:text-fg disabled:opacity-30"
                  >
                    <GripVertical className="size-3.5 rotate-90" />
                  </button>
                </div>

                <Input
                  value={column.name}
                  onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                  className="h-9 flex-1 font-mono text-sm"
                  aria-label="Column name"
                />

                <Tooltip label="Delete column">
                  <button
                    type="button"
                    onClick={() => removeColumn(column.id)}
                    aria-label={`Delete ${column.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Tooltip>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <Input
                  value={column.type}
                  onChange={(e) => updateColumn(column.id, { type: e.target.value })}
                  list="erd-types"
                  className="h-9 flex-1 font-mono text-sm"
                  aria-label="Column type"
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold">
                  <Checkbox
                    checked={column.isPrimaryKey}
                    onCheckedChange={(v) =>
                      updateColumn(column.id, {
                        isPrimaryKey: Boolean(v),
                        // A primary key is implicitly NOT NULL and unique;
                        // leaving the other boxes on would emit invalid DDL.
                        isNullable: v ? false : column.isNullable,
                        isUnique: v ? false : column.isUnique,
                      })
                    }
                    className="size-4"
                  />
                  <KeyRound className="size-3 text-xp-dark dark:text-xp" />
                  PK
                </label>

                <label
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-bold",
                    column.isPrimaryKey && "opacity-40",
                  )}
                >
                  <Checkbox
                    checked={!column.isNullable}
                    disabled={column.isPrimaryKey}
                    onCheckedChange={(v) =>
                      updateColumn(column.id, { isNullable: !v })
                    }
                    className="size-4"
                  />
                  NOT NULL
                </label>

                <label
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-bold",
                    column.isPrimaryKey && "opacity-40",
                  )}
                >
                  <Checkbox
                    checked={column.isUnique}
                    disabled={column.isPrimaryKey}
                    onCheckedChange={(v) =>
                      updateColumn(column.id, { isUnique: Boolean(v) })
                    }
                    className="size-4"
                  />
                  UNIQUE
                </label>
              </div>

              {/* Foreign key */}
              <div className="mt-3 border-t border-border-base pt-2.5">
                {column.references ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs">
                      <span className="font-bold text-aqua-600 dark:text-aqua-300">
                        → {" "}
                        {
                          diagram.tables.find(
                            (t) => t.id === column.references!.tableId,
                          )?.name
                        }
                        .
                        {
                          diagram.tables
                            .find((t) => t.id === column.references!.tableId)
                            ?.columns.find((c) => c.id === column.references!.columnId)
                            ?.name
                        }
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => updateColumn(column.id, { references: undefined })}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-fg-subtle hover:text-danger"
                    >
                      <Unlink className="size-3.5" />
                      Unlink
                    </button>
                  </div>
                ) : (
                  <select
                    value=""
                    onChange={(e) => {
                      const [tableId, columnId] = e.target.value.split("::");
                      if (tableId && columnId) {
                        updateColumn(column.id, {
                          references: { tableId, columnId },
                        });
                      }
                    }}
                    className="h-8 w-full rounded-lg border border-border-base bg-bg-elevated px-2 text-xs font-semibold"
                    aria-label={`Foreign key for ${column.name}`}
                  >
                    <option value="">No foreign key</option>
                    {otherTables.map((t) => (
                      <optgroup key={t.id} label={t.name}>
                        {t.columns.map((c) => (
                          <option key={c.id} value={`${t.id}::${c.id}`}>
                            {t.name}.{c.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>

        <datalist id="erd-types">
          {COMMON_TYPES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="border-t border-border-base p-4">
        <Button variant="danger" full onClick={onDelete}>
          <Trash2 />
          Delete table
        </Button>
      </div>
    </div>
  );
}
