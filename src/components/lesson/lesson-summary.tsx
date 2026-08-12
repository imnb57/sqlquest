"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Home, RotateCcw, Target, Timer, Zap } from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LottiePlayer } from "@/components/animation/lottie";
import { TIER_STYLES } from "@/lib/gamification/achievements";
import type { LessonCompletionSummary } from "@/stores/progress-store";
import type { LessonRef } from "@/content/types";

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border-base bg-bg-elevated p-4 text-center">
      <div className={cn("mx-auto grid size-9 place-items-center rounded-lg", tone)}>
        {icon}
      </div>
      <p className="mt-2 text-xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs font-bold tracking-wide text-fg-subtle uppercase">
        {label}
      </p>
    </div>
  );
}

export function LessonSummary({
  summary,
  lessonRef,
  next,
  secondsSpent,
  onReplay,
}: {
  summary: LessonCompletionSummary;
  lessonRef: LessonRef;
  next?: LessonRef;
  secondsSpent: number;
  onReplay: () => void;
}) {
  const { lesson } = lessonRef;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 text-center">
      <div className="mx-auto size-40 sm:size-48">
        <LottiePlayer
          name={summary.perfect ? "celebrate" : "level-up"}
          loop={false}
          className="size-full"
          fallback={<span className="text-6xl">🎉</span>}
        />
      </div>

      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
        {summary.perfect ? "Flawless!" : "Lesson complete!"}
      </h1>
      <p className="mt-2 text-fg-muted">
        {summary.perfect
          ? "Every answer right first time. That's mastery."
          : `You finished ${lesson.title}.`}
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={<Zap className="size-4.5 text-xp-dark dark:text-xp" />}
          label="XP earned"
          value={`+${summary.xpAwarded}`}
          tone="bg-xp/15"
        />
        <Stat
          icon={<Target className="size-4.5 text-brand-500" />}
          label="Accuracy"
          value={`${summary.score}%`}
          tone="bg-brand-500/15"
        />
        <Stat
          icon={<span className="text-base">🔥</span>}
          label="Day streak"
          value={summary.streak}
          tone="bg-streak/15"
        />
        <Stat
          icon={<Timer className="size-4.5 text-aqua-600 dark:text-aqua-300" />}
          label="Time"
          value={formatDuration(Math.max(1, Math.round(secondsSpent / 60)))}
          tone="bg-aqua-500/15"
        />
      </div>

      {summary.leveledUpTo && (
        <div className="mt-5 rounded-2xl border-2 border-xp/45 bg-xp/10 p-4">
          <p className="text-sm font-extrabold tracking-wide text-xp-dark uppercase dark:text-xp">
            Level up!
          </p>
          <p className="mt-1 text-2xl font-extrabold">
            You reached level {summary.leveledUpTo}
          </p>
        </div>
      )}

      {summary.goalMet && (
        <p className="mt-4 text-sm font-bold text-success">
          🎯 Daily goal reached — bonus XP awarded.
        </p>
      )}

      {summary.unlocked.length > 0 && (
        <div className="mt-6 text-left">
          <p className="mb-2 eyebrow text-fg-subtle">
            {summary.unlocked.length} achievement
            {summary.unlocked.length === 1 ? "" : "s"} unlocked
          </p>
          <ul className="space-y-2">
            {summary.unlocked.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 ring-2",
                  TIER_STYLES[a.tier].bg,
                  TIER_STYLES[a.tier].ring,
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {a.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">{a.title}</span>
                  <span className="block text-xs text-fg-muted">{a.description}</span>
                </span>
                <Badge variant="aqua" size="sm">
                  +{a.gemReward} 💎
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2.5">
        {next ? (
          <Button size="xl" full uppercase asChild>
            <Link href={`/learn/${next.lesson.slug}`}>
              Next: {next.lesson.title}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button size="xl" full uppercase asChild>
            <Link href="/learn">
              Back to the map
              <ArrowRight />
            </Link>
          </Button>
        )}

        <div className="flex gap-2.5">
          <Button variant="outline" full onClick={onReplay}>
            <RotateCcw />
            Practise again
          </Button>
          <Button variant="ghost" full asChild>
            <Link href="/learn">
              <Home />
              Map
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
