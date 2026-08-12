"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getResumeLesson, curriculumStats } from "@/content/curriculum";
import { useProgressStore } from "@/stores/progress-store";

/** "Pick up where you left off" card — the single highest-value CTA in the app. */
export function ContinueBanner({ className }: { className?: string }) {
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

  if (!hasHydrated) {
    return <div className={cn("h-32 rounded-2xl bg-bg-inset shimmer", className)} />;
  }

  const resume = getResumeLesson(completedIds);
  if (!resume) return null;

  const done = completedIds.size;
  const fresh = done === 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border-base bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-aqua-400/25 blur-3xl"
      />

      <div className="relative">
        <p className="flex items-center gap-1.5 eyebrow opacity-85">
          <Sparkles className="size-3.5" />
          {fresh ? "Start here" : "Continue learning"}
        </p>

        <h2 className="mt-1.5 text-xl font-extrabold">{resume.lesson.title}</h2>
        <p className="mt-1 text-sm opacity-90">{resume.lesson.subtitle}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="accent" size="lg" asChild>
            <Link href={`/learn/${resume.lesson.slug}`}>
              {fresh ? "Start first lesson" : "Continue"}
              <ArrowRight />
            </Link>
          </Button>
          <span className="text-xs font-semibold opacity-85">
            {formatDuration(resume.lesson.estimatedMinutes)} ·{" "}
            {resume.lesson.challenges.length} challenges
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between eyebrow opacity-85">
            <span>Course progress</span>
            <span className="tabular-nums">
              {done}/{curriculumStats.lessons}
            </span>
          </div>
          <Progress
            value={done}
            max={curriculumStats.lessons}
            size="sm"
            tone="success"
            className="bg-black/25"
            label="Course progress"
          />
        </div>
      </div>
    </div>
  );
}
