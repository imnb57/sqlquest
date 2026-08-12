"use client";

import * as React from "react";
import Link from "next/link";
import { Dumbbell, Filter, Repeat, Shuffle, Target } from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/form-controls";
import { allLessons, tracks } from "@/content/curriculum";
import { useProgressStore } from "@/stores/progress-store";
import { LottiePlayer } from "@/components/animation/lottie";

/**
 * Practice hub.
 *
 * Three ways back into material you've already seen: the lessons you got
 * wrong most often, a random completed lesson, and a filtered browse. Nothing
 * here costs hearts — the point is repetition without pressure.
 */

type Mode = "weakest" | "all" | "unfinished";

export function PracticeView() {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const lessonRecords = useProgressStore((s) => s.lessons);
  const [trackFilter, setTrackFilter] = React.useState("all");
  const [mode, setMode] = React.useState<Mode>("weakest");

  const rows = React.useMemo(() => {
    return allLessons
      .map((ref) => {
        const record = lessonRecords[ref.lesson.id];
        return {
          ref,
          completed: record?.status === "completed",
          score: record?.bestScore ?? 0,
          attempts: record?.attempts ?? 0,
          started: Boolean(record),
        };
      })
      .filter((row) => (trackFilter === "all" ? true : row.ref.track.slug === trackFilter))
      .filter((row) => {
        if (mode === "weakest") return row.completed;
        if (mode === "unfinished") return !row.completed;
        return true;
      })
      .sort((a, b) => {
        if (mode === "weakest") return a.score - b.score || b.attempts - a.attempts;
        return a.ref.index - b.ref.index;
      });
  }, [lessonRecords, trackFilter, mode]);

  const completedRefs = React.useMemo(
    () => allLessons.filter((r) => lessonRecords[r.lesson.id]?.status === "completed"),
    [lessonRecords],
  );

  const randomHref = React.useCallback(() => {
    const pool = completedRefs.length > 0 ? completedRefs : allLessons.slice(0, 5);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return `/learn/${pick.lesson.slug}`;
  }, [completedRefs]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold sm:text-3xl">
          <Dumbbell className="size-7 text-brand-500" />
          Practice
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          Repetition is what moves SQL into long-term memory. Practice never
          costs hearts and never breaks your progress — replay anything, as
          often as you like.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card interactive className="p-5">
          <Target className="size-6 text-danger" />
          <h2 className="mt-2.5 font-extrabold">Weakest first</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Lessons where your accuracy was lowest.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setMode("weakest")}
          >
            Show list
          </Button>
        </Card>

        <Card interactive className="p-5">
          <Shuffle className="size-6 text-aqua-600 dark:text-aqua-300" />
          <h2 className="mt-2.5 font-extrabold">Random review</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Jump into a lesson you&rsquo;ve already finished.
          </p>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link href={randomHref()}>Surprise me</Link>
          </Button>
        </Card>

        <Card interactive className="p-5">
          <Repeat className="size-6 text-brand-500" />
          <h2 className="mt-2.5 font-extrabold">Unfinished</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Everything you haven&rsquo;t completed yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setMode("unfinished")}
          >
            Show list
          </Button>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-fg-subtle" />
        <Select value={trackFilter} onValueChange={setTrackFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tracks</SelectItem>
            {tracks.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.glyph} {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weakest">Weakest first</SelectItem>
            <SelectItem value="unfinished">Unfinished</SelectItem>
            <SelectItem value="all">Everything</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs font-bold text-fg-subtle tabular-nums">
          {rows.length} lesson{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {!hasHydrated ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-bg-inset shimmer" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto size-24">
            <LottiePlayer
              name="empty-search"
              className="size-full"
              fallback={<span className="text-4xl">🔍</span>}
            />
          </div>
          <p className="mt-2 font-bold">Nothing here yet</p>
          <p className="mt-1 text-sm text-fg-muted">
            {mode === "weakest"
              ? "Complete a lesson and it'll show up here for review."
              : "You've finished everything in this filter. Nice."}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/learn">Go to the map</Link>
          </Button>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ ref, completed, score, attempts }) => (
            <li key={ref.lesson.id}>
              <Link
                href={`/learn/${ref.lesson.slug}`}
                className={cn(
                  "flex items-center gap-4 rounded-xl border border-border-base bg-bg-elevated p-3.5 transition-all",
                  "hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md",
                )}
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg-inset text-xl"
                >
                  {ref.track.glyph}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{ref.lesson.title}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {ref.track.title} · {ref.unit.title} ·{" "}
                    {formatDuration(ref.lesson.estimatedMinutes)}
                  </p>
                </div>

                {completed ? (
                  <Badge
                    variant={score === 100 ? "success" : score >= 70 ? "warning" : "danger"}
                    size="sm"
                  >
                    {score}%
                  </Badge>
                ) : attempts > 0 ? (
                  <Badge variant="neutral" size="sm">
                    In progress
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    New
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
