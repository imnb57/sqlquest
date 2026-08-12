"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn, localDayKey } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";

/**
 * XP earned per day over the last two weeks.
 *
 * One series, one axis, one measure — so there's no legend (the title names
 * it) and no categorical palette to validate. The daily-goal line is the
 * comparison, drawn recessive so the bars stay the figure. Today is filled
 * with the accent step so it reads without needing a second hue.
 */

const DAYS = 14;

interface Point {
  day: string;
  label: string;
  xp: number;
  isToday: boolean;
}

function CustomTooltip({
  active,
  payload,
  goal,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  goal: number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border-base bg-bg-elevated px-3 py-2 shadow-lg">
      <p className="text-xs font-extrabold">{point.label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-brand-600 dark:text-brand-300">
        {point.xp} XP
      </p>
      <p className="text-xs font-semibold text-fg-subtle">
        {point.xp >= goal ? "Goal met" : `${goal - point.xp} short of goal`}
      </p>
    </div>
  );
}

export function XpChart({ className }: { className?: string }) {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const activity = useProgressStore((s) => s.activity);
  const goal = useProgressStore((s) => s.dailyGoal);

  const data = React.useMemo<Point[]>(() => {
    const today = localDayKey();
    const points: Point[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - (DAYS - 1));

    for (let i = 0; i < DAYS; i++) {
      const key = localDayKey(cursor);
      points.push({
        day: key,
        label: cursor.toLocaleDateString("en", { weekday: "short", day: "numeric" }),
        xp: activity[key]?.xp ?? 0,
        isToday: key === today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }, [activity]);

  const best = Math.max(goal, ...data.map((d) => d.xp));

  if (!hasHydrated) {
    return <div className={cn("h-56 rounded-xl bg-bg-inset shimmer", className)} />;
  }

  return (
    <figure className={cn("min-w-0", className)}>
      <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="section-label">
          XP — last {DAYS} days
        </h3>
        <p className="text-xs font-semibold text-fg-subtle">
          Dashed line is your {goal} XP daily goal
        </p>
      </figcaption>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -22 }}>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="2 4"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
              tick={{ fill: "var(--fg-subtle)", fontSize: 12, fontWeight: 700 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              domain={[0, Math.ceil((best * 1.15) / 10) * 10]}
              tick={{ fill: "var(--fg-subtle)", fontSize: 12, fontWeight: 700 }}
            />
            <RechartsTooltip
              cursor={{ fill: "var(--bg-inset)", radius: 6 }}
              content={<CustomTooltip goal={goal} />}
            />
            <ReferenceLine
              y={goal}
              stroke="var(--color-brand-400)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <Bar dataKey="xp" radius={[4, 4, 0, 0]} maxBarSize={22}>
              {data.map((point) => (
                <Cell
                  key={point.day}
                  fill={
                    point.isToday
                      ? "var(--color-lime-accent-500)"
                      : "var(--color-brand-500)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Relief for the contrast warning: the same numbers, readable as text. */}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-bold text-fg-subtle hover:text-fg">
          View as table
        </summary>
        <table className="mt-2 w-full text-xs">
          <caption className="sr-only">XP earned per day over the last {DAYS} days</caption>
          <thead>
            <tr className="text-left text-fg-subtle">
              <th scope="col" className="py-1 font-bold">Day</th>
              <th scope="col" className="py-1 text-right font-bold">XP</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.day} className="border-t border-border-base">
                <td className="py-1">{point.label}</td>
                <td className="py-1 text-right font-bold tabular-nums">{point.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
