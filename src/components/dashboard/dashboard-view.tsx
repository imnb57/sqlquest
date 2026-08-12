"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Medal,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

import { cn, formatCompact, formatDuration } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ContinueBanner } from "@/components/learn/continue-banner";
import { ActivityHeatmap } from "./activity-heatmap";
import { XpChart } from "./xp-chart";
import { LocalOnlyNotice } from "@/components/layout/user-menu";
import { useLevel, useProgressStore, useAchievementSnapshot } from "@/stores/progress-store";
import { evaluateAchievements, TIER_STYLES } from "@/lib/gamification/achievements";
import { curriculumStats, tracks } from "@/content/curriculum";
import { LottiePlayer } from "@/components/animation/lottie";
import { useIsMounted } from "@/hooks/use-client";

/** Hero number — a stat tile, deliberately not a chart. */
function StatTile({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("grid size-9 place-items-center rounded-lg", tone)}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl leading-none font-extrabold tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs font-bold tracking-wide text-fg-subtle uppercase">
        {label}
      </p>
      {sub && <p className="mt-0.5 text-xs text-fg-muted">{sub}</p>}
    </Card>
  );
}

export function DashboardView() {
  const { data: session } = useSession();
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const streak = useProgressStore((s) => s.streak);
  const longestStreak = useProgressStore((s) => s.longestStreak);
  const xp = useProgressStore((s) => s.xp);
  const lessons = useProgressStore((s) => s.lessons);
  const challenges = useProgressStore((s) => s.challenges);
  const activity = useProgressStore((s) => s.activity);
  const level = useLevel();
  const snapshot = useAchievementSnapshot();

  const completedLessons = React.useMemo(
    () => Object.values(lessons).filter((l) => l.status === "completed").length,
    [lessons],
  );
  const solvedChallenges = React.useMemo(
    () => Object.values(challenges).filter((c) => c.correct).length,
    [challenges],
  );
  const totalSeconds = React.useMemo(
    () => Object.values(activity).reduce((s, d) => s + d.seconds, 0),
    [activity],
  );

  const recentAchievements = React.useMemo(
    () =>
      evaluateAchievements(snapshot)
        .filter((a) => a.unlocked)
        .slice(-4)
        .reverse(),
    [snapshot],
  );

  const nearlyThere = React.useMemo(
    () =>
      evaluateAchievements(snapshot)
        .filter((a) => !a.unlocked && !a.achievement.secret && a.percent > 0)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3),
    [snapshot],
  );

  const firstName = session?.user?.name?.split(" ")[0];
  const greeting = useGreeting();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {streak > 0
              ? `You're on a ${streak}-day streak. Keep it alive.`
              : "Finish one lesson today to start a streak."}
          </p>
        </div>

        <Badge
          size="lg"
          className={cn(
            "bg-gradient-to-r text-white",
            level.rank.gradient,
          )}
        >
          {level.rank.glyph} {level.rank.title} · Level {level.level}
        </Badge>
      </header>

      <LocalOnlyNotice />

      <ContinueBanner />

      <section aria-label="Your statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<Zap className="size-4.5 text-xp-dark dark:text-xp" />}
          label="Total XP"
          value={hasHydrated ? formatCompact(xp) : "—"}
          sub={
            level.isMaxLevel
              ? "Max level"
              : `${level.xpForNextLevel - level.xpIntoLevel} to level ${level.level + 1}`
          }
          tone="bg-xp/15"
        />
        <StatTile
          icon={<Flame className="size-4.5 text-streak" />}
          label="Day streak"
          value={hasHydrated ? streak : "—"}
          sub={`Best: ${longestStreak}`}
          tone="bg-streak/15"
        />
        <StatTile
          icon={<BookOpen className="size-4.5 text-brand-500" />}
          label="Lessons done"
          value={hasHydrated ? `${completedLessons}` : "—"}
          sub={`of ${curriculumStats.lessons}`}
          tone="bg-brand-500/15"
        />
        <StatTile
          icon={<Target className="size-4.5 text-success" />}
          label="Challenges"
          value={hasHydrated ? solvedChallenges : "—"}
          sub={`of ${curriculumStats.challenges}`}
          tone="bg-success/15"
        />
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 section-label">
            <TrendingUp className="size-4 text-brand-500" />
            Track progress
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/learn">
              Open map
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <ul className="space-y-3.5">
          {tracks.map((track) => {
            const trackLessons = track.units.flatMap((u) => u.lessons);
            const done = trackLessons.filter(
              (l) => lessons[l.id]?.status === "completed",
            ).length;

            return (
              <li key={track.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <Link
                    href={`/courses/${track.slug}`}
                    className="flex min-w-0 items-center gap-2 text-sm font-bold hover:text-brand-500"
                  >
                    <span aria-hidden="true">{track.glyph}</span>
                    <span className="truncate">{track.title}</span>
                  </Link>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-fg-subtle">
                    {done}/{trackLessons.length}
                  </span>
                </div>
                <Progress
                  value={done}
                  max={trackLessons.length}
                  size="sm"
                  tone={done === trackLessons.length ? "success" : "brand"}
                  label={`${track.title} progress`}
                />
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 section-label">
              <Medal className="size-4 text-xp-dark dark:text-xp" />
              Recent unlocks
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/achievements">All</Link>
            </Button>
          </div>

          {recentAchievements.length === 0 ? (
            <div className="py-6 text-center">
              <div className="mx-auto size-20">
                <LottiePlayer
                  name="empty-search"
                  className="size-full"
                  fallback={<span className="text-3xl">🏅</span>}
                />
              </div>
              <p className="mt-1 text-sm text-fg-muted">
                Solve your first challenge to unlock an achievement.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentAchievements.map(({ achievement }) => (
                <li
                  key={achievement.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-2.5 ring-1",
                    TIER_STYLES[achievement.tier].bg,
                    TIER_STYLES[achievement.tier].ring,
                  )}
                >
                  <span className="text-xl" aria-hidden="true">
                    {achievement.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">
                      {achievement.title}
                    </span>
                    <span className="block truncate text-xs text-fg-muted">
                      {achievement.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 section-label">
            <Timer className="size-4 text-aqua-600 dark:text-aqua-300" />
            Almost there
          </h2>

          {nearlyThere.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              Start learning and your closest achievements will show up here.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {nearlyThere.map(({ achievement, progress, percent }) => (
                <li key={achievement.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
                      <span aria-hidden="true">{achievement.glyph}</span>
                      <span className="truncate">{achievement.title}</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-fg-subtle">
                      {progress}/{achievement.goal}
                    </span>
                  </div>
                  <Progress
                    value={percent}
                    size="xs"
                    tone="aqua"
                    label={achievement.title}
                  />
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 border-t border-border-base pt-3 text-xs text-fg-muted">
            Total practice time:{" "}
            <strong className="font-extrabold text-fg">
              {formatDuration(Math.round(totalSeconds / 60))}
            </strong>
          </p>
        </Card>
      </div>
    </div>
  );
}

/**
 * Time-of-day greeting.
 *
 * Only computed after hydration: the server renders in UTC and the visitor may
 * be anywhere, so deriving it during the first render would guarantee a
 * mismatch.
 */
function useGreeting(): string {
  const mounted = useIsMounted();
  if (!mounted) return "Welcome back";

  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
