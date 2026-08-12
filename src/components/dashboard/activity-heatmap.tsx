"use client";

import * as React from "react";

import { cn, localDayKey } from "@/lib/utils";
import { Tooltip } from "@/components/ui/overlays";
import { useProgressStore } from "@/stores/progress-store";

/**
 * Contribution-style activity grid.
 *
 * Encoding: sequential, single hue, light → dark — magnitude only, never
 * categorical. The two lightest steps sit under 3:1 against the surface, so
 * every cell carries an exact value in its accessible name and a tooltip, and
 * the scale is spelled out in a legend. Empty days get a ring rather than a
 * fill so "no activity" is visibly distinct from "a little activity".
 */

/** Monotonically darkening steps of the brand hue. Index 0 = no activity. */
const STEPS = [
  "bg-bg-inset ring-1 ring-inset ring-border-base",
  "bg-brand-200 dark:bg-brand-900",
  "bg-brand-300 dark:bg-brand-800",
  "bg-brand-400 dark:bg-brand-600",
  "bg-brand-600 dark:bg-brand-400",
] as const;

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function stepFor(xp: number, max: number): number {
  if (xp <= 0) return 0;
  if (max <= 0) return 1;
  const ratio = xp / max;
  if (ratio > 0.66) return 4;
  if (ratio > 0.33) return 3;
  if (ratio > 0.12) return 2;
  return 1;
}

function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ActivityHeatmap({
  weeks = 26,
  className,
}: {
  weeks?: number;
  className?: string;
}) {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const activity = useProgressStore((s) => s.activity);

  /** Columns of 7 days, oldest first, ending on today's week. */
  const { columns, max, total, activeDays } = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Wind back to the Sunday that starts the earliest displayed week.
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const start = new Date(end);
    start.setDate(start.getDate() - (weeks * 7 - 1));

    const cols: { key: string; xp: number; future: boolean }[][] = [];
    let peak = 0;
    let sum = 0;
    let active = 0;

    const cursor = new Date(start);
    for (let w = 0; w < weeks; w++) {
      const column: { key: string; xp: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = localDayKey(cursor);
        const xp = activity[key]?.xp ?? 0;
        peak = Math.max(peak, xp);
        sum += xp;
        if (xp > 0) active++;
        column.push({ key, xp, future: cursor > today });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(column);
    }

    return { columns: cols, max: peak, total: sum, activeDays: active };
  }, [activity, weeks]);

  if (!hasHydrated) {
    return <div className={cn("h-36 rounded-xl bg-bg-inset shimmer", className)} />;
  }

  return (
    <figure className={cn("min-w-0", className)}>
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="section-label">
          Activity
        </h3>
        <p className="text-xs font-semibold text-fg-muted">
          <span className="tabular-nums">{total.toLocaleString()}</span> XP across{" "}
          <span className="tabular-nums">{activeDays}</span> active day
          {activeDays === 1 ? "" : "s"}
        </p>
      </figcaption>

      <div className="flex gap-1.5 overflow-x-auto scroll-thin pb-1">
        <div
          className="grid shrink-0 grid-rows-7 gap-[3px] pr-1 text-2xs font-bold text-fg-subtle"
          aria-hidden="true"
        >
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="flex h-3 items-center leading-none">
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {columns.map((column, ci) => (
            <div key={ci} className="grid grid-rows-7 gap-[3px]">
              {column.map((cell) =>
                cell.future ? (
                  <span key={cell.key} className="size-3" />
                ) : (
                  <Tooltip
                    key={cell.key}
                    label={`${cell.xp} XP on ${shortDate(cell.key)}`}
                  >
                    <span
                      role="img"
                      aria-label={`${cell.xp} XP on ${shortDate(cell.key)}`}
                      className={cn(
                        "size-3 rounded-[3px] transition-transform hover:scale-125",
                        STEPS[stepFor(cell.xp, max)],
                      )}
                    />
                  </Tooltip>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-2xs font-bold text-fg-subtle">
        <span>Less</span>
        {STEPS.map((step, i) => (
          <span key={i} className={cn("size-3 rounded-[3px]", step)} aria-hidden="true" />
        ))}
        <span>More</span>
      </div>
    </figure>
  );
}
