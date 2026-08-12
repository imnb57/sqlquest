"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Info,
  Lightbulb,
  Target,
} from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock, InlineMarkdown } from "./prompt-text";
import { CHALLENGE_TYPE_LABEL } from "./challenges";
import type { Concept, Lesson, Track, Unit } from "@/content/types";

const TONE_STYLES = {
  info: { icon: Info, className: "border-aqua-500/35 bg-aqua-500/8", text: "text-aqua-600 dark:text-aqua-300" },
  tip: { icon: Lightbulb, className: "border-lime-accent-500/40 bg-lime-accent-400/10", text: "text-lime-accent-600" },
  warning: { icon: AlertTriangle, className: "border-warning/45 bg-warning/10", text: "text-warning" },
} as const;

function ConceptCard({ concept, index }: { concept: Concept; index: number }) {
  const tone = concept.tone ? TONE_STYLES[concept.tone] : null;
  const Icon = tone?.icon;

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        tone ? tone.className : "border-border-base bg-bg-elevated",
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <h3 className="flex items-start gap-2.5 text-base font-extrabold">
        {Icon ? (
          <Icon className={cn("mt-0.5 size-5 shrink-0", tone?.text)} />
        ) : (
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-brand-500/15 text-xs font-extrabold text-brand-600 tabular-nums dark:text-brand-300">
            {index + 1}
          </span>
        )}
        {/* Titles carry inline code — `AND` narrows, `OR` widens — so they go
            through the same renderer as the body, not out as raw text. */}
        <span className="min-w-0">
          <InlineMarkdown>{concept.title}</InlineMarkdown>
        </span>
      </h3>

      <div className="mt-2 pl-7.5 text-sm leading-relaxed text-fg-muted">
        <InlineMarkdown>{concept.body}</InlineMarkdown>
      </div>

      {concept.example && (
        <div className="mt-4 pl-7.5">
          <CodeBlock code={concept.example.sql} caption={concept.example.caption} />
        </div>
      )}
    </section>
  );
}

export function ConceptIntro({
  lesson,
  unit,
  track,
  onStart,
  resumeCount,
}: {
  lesson: Lesson;
  unit: Unit;
  track: Track;
  onStart: () => void;
  /** How many challenges are already solved, for the resume label. */
  resumeCount: number;
}) {
  const types = Array.from(new Set(lesson.challenges.map((c) => c.type)));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-28 sm:pt-12">
      {/* The X in the lesson top bar only exists once the lesson is running,
          so the intro needs its own way out — plus a breadcrumb, since people
          land here directly from search results. */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <li>
            <Link
              href="/learn"
              className="inline-flex items-center gap-1.5 font-bold text-fg-muted transition-colors hover:text-brand-500"
            >
              <ArrowLeft className="size-4" />
              Learning path
            </Link>
          </li>
          <li aria-hidden="true" className="text-fg-subtle">
            /
          </li>
          <li>
            <Link
              href={`/courses/${track.slug}`}
              className="font-bold text-fg-muted transition-colors hover:text-brand-500"
            >
              {track.title}
            </Link>
          </li>
        </ol>
      </nav>

      <p className="eyebrow text-fg-subtle">{unit.title}</p>

      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{lesson.title}</h1>
      <p className="mt-2 text-lg text-fg-muted">{lesson.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="default" size="lg">
          <Target />
          {lesson.objective}
        </Badge>
        <Badge variant="neutral">{formatDuration(lesson.estimatedMinutes)}</Badge>
        <Badge variant="neutral">
          {lesson.challenges.length} challenge
          {lesson.challenges.length === 1 ? "" : "s"}
        </Badge>
        <Badge
          variant={
            lesson.difficulty === "easy"
              ? "success"
              : lesson.difficulty === "medium"
                ? "warning"
                : "danger"
          }
        >
          {lesson.difficulty}
        </Badge>
        {lesson.kind === "boss" && <Badge variant="solid">⚔️ Checkpoint</Badge>}
      </div>

      <div className="mt-8 space-y-4">
        {lesson.concepts.map((concept, i) => (
          <ConceptCard key={concept.title} concept={concept} index={i} />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border-base bg-bg-subtle p-5">
        <p className="eyebrow text-fg-subtle">
          What&rsquo;s coming up
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {types.map((t) => (
            <Badge key={t} variant="outline">
              {CHALLENGE_TYPE_LABEL[t]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Padded so the sticky button below can never sit on top of the last
          concept card — it was covering the third one at common heights. */}
      <div className="sticky bottom-4 mt-8 pb-2">
        <Button size="xl" full uppercase onClick={onStart}>
          {resumeCount > 0
            ? `Resume (${resumeCount}/${lesson.challenges.length})`
            : "Start lesson"}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
