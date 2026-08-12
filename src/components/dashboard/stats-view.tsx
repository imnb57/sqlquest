"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Clock, Percent, Target } from "lucide-react";

import { cn, formatCompact, formatDuration } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityHeatmap } from "./activity-heatmap";
import { XpChart } from "./xp-chart";
import { allLessons, tracks } from "@/content/curriculum";
import { CHALLENGE_TYPE_LABEL } from "@/components/lesson/challenges";
import { useProgressStore, useLevel } from "@/stores/progress-store";
import type { ChallengeType } from "@/content/types";

/**
 * Deep statistics.
 *
 * Every number here is derived from local progress records — no server round
 * trip, so it works signed out and offline. Accuracy uses first-try success,
 * which is the only measure that can't be gamed by retrying.
 */
export function StatsView() {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const challengeRecords = useProgressStore((s) => s.challenges);
  const lessonRecords = useProgressStore((s) => s.lessons);
  const activity = useProgressStore((s) => s.activity);
  const perfectLessons = useProgressStore((s) => s.perfectLessons);
  const level = useLevel();

  /** Maps every challenge id to its lesson + track for grouping. */
  const challengeIndex = React.useMemo(() => {
    const map = new Map<
      string,
      { trackId: string; type: ChallengeType }
    >();
    for (const { lesson, track } of allLessons) {
      for (const challenge of lesson.challenges) {
        map.set(challenge.id, { trackId: track.id, type: challenge.type });
      }
    }
    return map;
  }, []);

  const stats = React.useMemo(() => {
    const byTrack = new Map<string, { attempted: number; firstTry: number }>();
    const byType = new Map<ChallengeType, { attempted: number; firstTry: number }>();

    let attempted = 0;
    let firstTry = 0;
    let totalAttempts = 0;

    for (const [id, record] of Object.entries(challengeRecords)) {
      const meta = challengeIndex.get(id);
      if (!meta) continue;

      attempted++;
      totalAttempts += record.attempts;
      if (record.firstTry) firstTry++;

      const t = byTrack.get(meta.trackId) ?? { attempted: 0, firstTry: 0 };
      t.attempted++;
      if (record.firstTry) t.firstTry++;
      byTrack.set(meta.trackId, t);

      const ty = byType.get(meta.type) ?? { attempted: 0, firstTry: 0 };
      ty.attempted++;
      if (record.firstTry) ty.firstTry++;
      byType.set(meta.type, ty);
    }

    return {
      attempted,
      firstTry,
      accuracy: attempted > 0 ? Math.round((firstTry / attempted) * 100) : 0,
      avgAttempts: attempted > 0 ? totalAttempts / attempted : 0,
      byTrack,
      byType,
    };
  }, [challengeRecords, challengeIndex]);

  const totalSeconds = React.useMemo(
    () => Object.values(activity).reduce((s, d) => s + d.seconds, 0),
    [activity],
  );
  const activeDays = Object.keys(activity).length;

  if (!hasHydrated) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-bg-inset shimmer" />
        ))}
      </div>
    );
  }

  if (stats.attempted === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <BarChart3 className="mx-auto size-10 text-fg-subtle" />
        <h1 className="mt-4 text-2xl font-extrabold">No statistics yet</h1>
        <p className="mx-auto mt-2 max-w-md text-fg-muted">
          Answer a few challenges and this page fills up with accuracy by
          track, performance by question type, and your activity history.
        </p>
        <Button className="mt-6" size="lg" asChild>
          <Link href="/learn">Start learning</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold sm:text-3xl">
          <BarChart3 className="size-7 text-brand-500" />
          Statistics
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Accuracy is measured on first attempts with no hints — the honest
          number.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: <Percent className="size-4.5 text-success" />,
            label: "First-try accuracy",
            value: `${stats.accuracy}%`,
            tone: "bg-success/15",
          },
          {
            icon: <Target className="size-4.5 text-brand-500" />,
            label: "Challenges attempted",
            value: formatCompact(stats.attempted),
            tone: "bg-brand-500/15",
          },
          {
            icon: <Clock className="size-4.5 text-aqua-600 dark:text-aqua-300" />,
            label: "Time practised",
            value: formatDuration(Math.round(totalSeconds / 60)),
            tone: "bg-aqua-500/15",
          },
          {
            icon: <BarChart3 className="size-4.5 text-xp-dark dark:text-xp" />,
            label: "Active days",
            value: activeDays,
            tone: "bg-xp/15",
          },
        ].map((tile) => (
          <Card key={tile.label} className="p-4">
            <div className={cn("grid size-9 place-items-center rounded-lg", tile.tone)}>
              {tile.icon}
            </div>
            <p className="mt-3 text-2xl leading-none font-extrabold tabular-nums">
              {tile.value}
            </p>
            <p className="mt-1.5 text-xs font-bold tracking-wide text-fg-subtle uppercase">
              {tile.label}
            </p>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <XpChart />
        </Card>
        <Card className="p-5">
          <ActivityHeatmap weeks={20} />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="section-label">
          Accuracy by track
        </h2>
        <p className="mt-1 text-xs text-fg-muted">
          Where your SQL is solid and where it needs another pass.
        </p>

        <ul className="mt-4 space-y-4">
          {tracks.map((track) => {
            const entry = stats.byTrack.get(track.id);
            const trackChallenges = track.units
              .flatMap((u) => u.lessons)
              .reduce((n, l) => n + l.challenges.length, 0);
            const accuracy = entry
              ? Math.round((entry.firstTry / entry.attempted) * 100)
              : null;

            return (
              <li key={track.id}>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
                    <span aria-hidden="true">{track.glyph}</span>
                    <span className="truncate">{track.title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-bold tabular-nums text-fg-subtle">
                    {entry ? `${entry.attempted}/${trackChallenges} seen` : "Not started"}
                    {accuracy !== null && (
                      <Badge
                        size="sm"
                        variant={
                          accuracy >= 80 ? "success" : accuracy >= 55 ? "warning" : "danger"
                        }
                      >
                        {accuracy}%
                      </Badge>
                    )}
                  </span>
                </div>
                <Progress
                  value={accuracy ?? 0}
                  size="sm"
                  tone={
                    accuracy === null
                      ? "brand"
                      : accuracy >= 80
                        ? "success"
                        : accuracy >= 55
                          ? "xp"
                          : "streak"
                  }
                  label={`${track.title} accuracy`}
                />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="section-label">
          By question type
        </h2>

        <div className="mt-3 overflow-x-auto scroll-thin">
          <table className="w-full text-sm">
            <caption className="sr-only">
              First-try accuracy grouped by challenge type
            </caption>
            <thead>
              <tr className="border-b border-border-strong text-left text-xs text-fg-subtle">
                <th scope="col" className="py-2 font-extrabold uppercase">Type</th>
                <th scope="col" className="py-2 text-right font-extrabold uppercase">Seen</th>
                <th scope="col" className="py-2 text-right font-extrabold uppercase">First try</th>
                <th scope="col" className="py-2 text-right font-extrabold uppercase">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(stats.byType.entries())
                .sort((a, b) => b[1].attempted - a[1].attempted)
                .map(([type, entry]) => {
                  const accuracy = Math.round((entry.firstTry / entry.attempted) * 100);
                  return (
                    <tr key={type} className="border-b border-border-base last:border-b-0">
                      <td className="py-2.5 font-bold">{CHALLENGE_TYPE_LABEL[type]}</td>
                      <td className="py-2.5 text-right tabular-nums">{entry.attempted}</td>
                      <td className="py-2.5 text-right tabular-nums">{entry.firstTry}</td>
                      <td className="py-2.5 text-right">
                        <Badge
                          size="sm"
                          variant={
                            accuracy >= 80 ? "success" : accuracy >= 55 ? "warning" : "danger"
                          }
                        >
                          {accuracy}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="section-label">Milestones</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["Current level", `${level.level} — ${level.rank.title}`],
            ["Lessons completed", `${Object.values(lessonRecords).filter((l) => l.status === "completed").length}`],
            ["Average attempts per challenge", stats.avgAttempts.toFixed(2)],
            ["Perfect lessons", `${perfectLessons}`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-3 border-b border-border-base pb-2"
            >
              <dt className="text-sm text-fg-muted">{label}</dt>
              <dd className="text-sm font-extrabold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
