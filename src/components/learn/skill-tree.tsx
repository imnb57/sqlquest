"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Crown, Lock, Play, Star, Swords } from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/overlays";
import { tracks, isLessonUnlocked } from "@/content/curriculum";
import { lessonXp, type Lesson, type Track, type Unit } from "@/content/types";
import { useProgressStore } from "@/stores/progress-store";

/**
 * The learning path.
 *
 * A single winding column of lesson nodes, grouped by unit, in curriculum
 * order. Nodes alternate horizontally so the eye follows a path rather than a
 * list — the layout that makes "just one more" feel natural.
 */

/** Horizontal offset pattern, in percent, repeated down the path. */
const OFFSETS = [0, 14, 20, 14, 0, -14, -20, -14];

interface NodeState {
  status: "locked" | "available" | "completed";
  score: number;
}

function LessonNode({
  lesson,
  state,
  offset,
  isCurrent,
}: {
  lesson: Lesson;
  state: NodeState;
  offset: number;
  isCurrent: boolean;
}) {
  const locked = state.status === "locked";
  const done = state.status === "completed";
  const boss = lesson.kind === "boss";

  const Icon = locked ? Lock : done ? Check : boss ? Swords : Play;

  const node = (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `translateX(${offset}%)` }}
    >
      {isCurrent && !locked && (
        <span className="absolute -top-9 animate-bounce rounded-lg bg-brand-600 px-2.5 py-1 eyebrow text-white shadow-lg">
          Start
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-brand-600" />
        </span>
      )}

      <div className="relative">
        {isCurrent && !locked && (
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/40" />
        )}

        <div
          className={cn(
            "btn-3d relative grid place-items-center rounded-full transition-all",
            boss ? "size-22" : "size-18",
            locked
              ? "bg-bg-inset text-fg-subtle shadow-[0_5px_0_0_var(--border)]"
              : done
                ? "bg-gradient-to-br from-lime-accent-400 to-success text-white shadow-[0_5px_0_0_oklch(0.55_0.16_145)]"
                : boss
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_5px_0_0_oklch(0.55_0.17_50)]"
                  : "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_5px_0_0_var(--color-brand-800)]",
          )}
        >
          <Icon className={cn(boss ? "size-9" : "size-7")} strokeWidth={2.75} />

          {done && state.score === 100 && (
            <Crown className="absolute -top-2 -right-1 size-6 fill-xp text-xp-dark drop-shadow" />
          )}
        </div>
      </div>

      <p
        className={cn(
          "mt-2.5 max-w-36 text-center text-xs leading-tight font-extrabold",
          locked ? "text-fg-subtle" : "text-fg",
        )}
      >
        {lesson.title}
      </p>

      {done && (
        <div className="mt-1 flex gap-0.5" aria-label={`Score ${state.score}%`}>
          {[33, 66, 99].map((threshold) => (
            <Star
              key={threshold}
              className={cn(
                "size-3",
                state.score >= threshold
                  ? "fill-xp text-xp-dark"
                  : "fill-bg-inset text-border-strong",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (locked) {
    return (
      <Tooltip label="Finish the previous lesson to unlock this one">
        <div className="cursor-not-allowed opacity-90">{node}</div>
      </Tooltip>
    );
  }

  return (
    <Link
      href={`/learn/${lesson.slug}`}
      className="rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      aria-label={`${lesson.title} — ${lesson.objective}`}
    >
      {node}
    </Link>
  );
}

function UnitHeader({
  unit,
  track,
  completed,
  total,
}: {
  unit: Unit;
  track: Track;
  completed: number;
  total: number;
}) {
  const totalXp = unit.lessons.reduce((sum, l) => sum + lessonXp(l), 0);
  const minutes = unit.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);

  return (
    <div
      className={cn(
        "sticky top-16 z-20 mb-10 rounded-2xl bg-gradient-to-r p-5 text-white shadow-lg lg:top-20",
        track.accent,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow opacity-85">
            {track.title}
          </p>
          <h2 className="mt-0.5 text-xl font-extrabold">{unit.title}</h2>
          <p className="mt-1 text-sm opacity-90">{unit.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-extrabold tabular-nums">
              {completed}/{total}
            </p>
            <p className="eyebrow opacity-85">
              lessons
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="border-white/25 bg-white/15 text-white hover:bg-white/25"
          >
            <Link href={`/courses/${track.slug}`}>Overview</Link>
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Progress
          value={completed}
          max={total}
          size="sm"
          className="flex-1 bg-black/20"
          label={`${unit.title} progress`}
        />
        <span className="text-xs font-bold whitespace-nowrap opacity-90">
          {totalXp} XP · {formatDuration(minutes)}
        </span>
      </div>
    </div>
  );
}

export function SkillTree() {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const lessons = useProgressStore((s) => s.lessons);

  const completedIds = React.useMemo(
    () =>
      new Set(
        Object.entries(lessons)
          .filter(([, l]) => l.status === "completed")
          .map(([id]) => id),
      ),
    [lessons],
  );

  // The first unlocked-but-unfinished lesson gets the "Start" pointer.
  const currentId = React.useMemo(() => {
    for (const track of tracks) {
      for (const unit of track.units) {
        for (const lesson of unit.lessons) {
          if (!completedIds.has(lesson.id) && isLessonUnlocked(lesson.id, completedIds)) {
            return lesson.id;
          }
        }
      }
    }
    return null;
  }, [completedIds]);

  if (!hasHydrated) {
    return (
      <div className="space-y-10">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-8">
            <div className="h-28 rounded-2xl bg-bg-inset shimmer" />
            <div className="mx-auto h-24 w-24 rounded-full bg-bg-inset shimmer" />
            <div className="mx-auto h-24 w-24 rounded-full bg-bg-inset shimmer" />
          </div>
        ))}
      </div>
    );
  }

  let nodeIndex = 0;

  return (
    <div className="space-y-16">
      {tracks.map((track) =>
        track.units.map((unit) => {
          const completed = unit.lessons.filter((l) => completedIds.has(l.id)).length;

          return (
            <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
              <h3 id={`unit-${unit.id}`} className="sr-only">
                {track.title} — {unit.title}
              </h3>

              <UnitHeader
                unit={unit}
                track={track}
                completed={completed}
                total={unit.lessons.length}
              />

              <ol className="flex flex-col items-center gap-11">
                {unit.lessons.map((lesson) => {
                  const offset = OFFSETS[nodeIndex++ % OFFSETS.length];
                  const record = lessons[lesson.id];
                  const state: NodeState = {
                    status: completedIds.has(lesson.id)
                      ? "completed"
                      : isLessonUnlocked(lesson.id, completedIds)
                        ? "available"
                        : "locked",
                    score: record?.bestScore ?? 0,
                  };

                  return (
                    <li key={lesson.id}>
                      <LessonNode
                        lesson={lesson}
                        state={state}
                        offset={offset}
                        isCurrent={lesson.id === currentId}
                      />
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        }),
      )}

      <div className="rounded-2xl border-2 border-dashed border-border-base p-10 text-center">
        <span className="text-4xl" aria-hidden="true">
          🏁
        </span>
        <h3 className="mt-3 text-xl font-extrabold">That&rsquo;s the whole path</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">
          Finish everything above and you&rsquo;ll have covered SQL from your
          first SELECT to reading query plans. Keep sharp with{" "}
          <Link href="/practice" className="font-bold text-brand-500 hover:underline">
            spaced practice
          </Link>
          .
        </p>
        <Badge variant="default" size="lg" className="mt-4">
          More tracks coming soon
        </Badge>
      </div>
    </div>
  );
}
