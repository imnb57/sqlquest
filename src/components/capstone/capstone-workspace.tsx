"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  ClipboardList,
  Loader2,
  Lock,
  Play,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/overlays";
import { SqlEditor } from "@/components/sql/sql-editor";
import { ResultGrid, ResultComparison } from "@/components/sql/result-grid";
import { SchemaPanel } from "@/components/sql/schema-panel";
import { InlineMarkdown, CodeBlock, PromptText } from "@/components/lesson/prompt-text";
import { LottiePlayer } from "@/components/animation/lottie";

import { useSqlEngine } from "@/hooks/use-sql-engine";
import { useProgressStore } from "@/stores/progress-store";
import { fireConfetti, playSound, celebrateWrong } from "@/lib/feedback";
import { praiseFor, nudge, BOOT_MESSAGES } from "@/lib/copy";
import { getDataset } from "@/content/datasets";
import { MILESTONE_XP, type BriefBlock, type Capstone } from "@/content/capstone-types";
import type { QueryResult } from "@/lib/sql/types";

/**
 * Capstone workspace.
 *
 * Deliberately not the lesson player. A lesson is a guided sequence; a project
 * is a workspace you move around in — the brief stays available, milestones are
 * a checklist rather than a forced march, and finished work accumulates on a
 * deliverables board so the learner can see the artefact taking shape.
 *
 * Grading reuses the lesson engine exactly, so a milestone is as rigorous as a
 * challenge and is covered by the same `verify:content` gate.
 */

function BriefBlocks({ blocks }: { blocks: BriefBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "p":
            return (
              <p key={i} className="text-sm leading-relaxed text-fg-muted">
                <InlineMarkdown>{block.text}</InlineMarkdown>
              </p>
            );
          case "list":
            return (
              <ul
                key={i}
                className="ml-5 list-disc space-y-1.5 text-sm text-fg-muted marker:text-brand-500"
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <InlineMarkdown>{item}</InlineMarkdown>
                  </li>
                ))}
              </ul>
            );
          case "code":
            return <CodeBlock key={i} code={block.sql} caption={block.caption} />;
          case "callout":
            return (
              <aside
                key={i}
                className={cn(
                  "rounded-xl border p-3.5",
                  block.tone === "warning"
                    ? "border-warning/45 bg-warning/10"
                    : block.tone === "tip"
                      ? "border-lime-accent-500/40 bg-lime-accent-400/10"
                      : "border-aqua-500/35 bg-aqua-500/8",
                )}
              >
                <p className="text-sm font-extrabold">{block.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                  <InlineMarkdown>{block.text}</InlineMarkdown>
                </p>
              </aside>
            );
        }
      })}
    </div>
  );
}

export function CapstoneWorkspace({ capstone }: { capstone: Capstone }) {
  const engine = useSqlEngine(capstone.datasetId);
  const dataset = React.useMemo(
    () => getDataset(capstone.datasetId),
    [capstone.datasetId],
  );

  const record = useProgressStore((s) => s.capstones[capstone.id]);
  const completeMilestone = useProgressStore((s) => s.completeMilestone);
  const hasHydrated = useProgressStore((s) => s.hasHydrated);

  const completed = React.useMemo(
    () => new Set(record?.completed ?? []),
    [record?.completed],
  );

  // Open the first unfinished milestone.
  const firstOpen = Math.max(
    0,
    capstone.milestones.findIndex((m) => !completed.has(m.id)),
  );
  const [index, setIndex] = React.useState(0);
  const [seeded, setSeeded] = React.useState(false);
  if (hasHydrated && !seeded) {
    setSeeded(true);
    setIndex(firstOpen === -1 ? capstone.milestones.length - 1 : firstOpen);
  }

  const milestone = capstone.milestones[index];

  const [sql, setSql] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [verdict, setVerdict] = React.useState<
    | null
    | { ok: true; headline: string }
    | { ok: false; headline: string; message?: string; hint?: string; actual?: QueryResult | null; expected?: QueryResult | null; diffRows?: number[] }
  >(null);
  const [hintsShown, setHintsShown] = React.useState(0);

  // Reset the editor when the milestone changes.
  const [renderedIndex, setRenderedIndex] = React.useState(index);
  if (renderedIndex !== index) {
    setRenderedIndex(index);
    setSql(record?.submissions[milestone.id] ?? "");
    setVerdict(null);
    setHintsShown(0);
  }

  const booting = engine.status === "booting" || engine.status === "seeding";
  const done = completed.size;
  const total = capstone.milestones.length;
  const projectDone = done >= total;

  const check = React.useCallback(async () => {
    if (!sql.trim()) return;
    setChecking(true);
    try {
      const outcome = await engine.grade(
        sql,
        milestone.solution,
        milestone.grading,
        milestone.verifyQuery,
      );

      if (outcome.correct) {
        const result = completeMilestone({
          capstoneId: capstone.id,
          milestoneId: milestone.id,
          submission: sql,
          totalMilestones: total,
          xp: milestone.xp ?? MILESTONE_XP,
        });
        setVerdict({ ok: true, headline: praiseFor(done + 1) });
        playSound(result.projectComplete ? "complete" : "correct");
        void fireConfetti(result.projectComplete ? "large" : "small");
        if (result.xpAwarded > 0) {
          toast.success(`Milestone complete · +${result.xpAwarded} XP`);
        }
      } else {
        setVerdict({
          ok: false,
          headline: nudge(),
          message: outcome.message,
          hint: outcome.hint,
          actual: outcome.actual ?? null,
          expected: outcome.expected ?? null,
          diffRows: outcome.diffRows,
        });
        celebrateWrong();
      }
    } finally {
      setChecking(false);
    }
  }, [sql, engine, milestone, capstone.id, completeMilestone, total, done]);

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border-base bg-bg/90 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-[100rem] items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft />
              Projects
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{capstone.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <Progress
                value={done}
                max={total}
                size="xs"
                tone="success"
                className="max-w-64"
                label="Project progress"
              />
              <span className="text-xs font-bold tabular-nums text-fg-subtle">
                {done}/{total}
              </span>
            </div>
          </div>

          <Badge variant={projectDone ? "success" : "neutral"} className="shrink-0">
            {projectDone ? "Complete" : capstone.difficulty}
          </Badge>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 py-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* ---------------------------------------------------- left rail */}
        <aside className="min-w-0 space-y-4">
          <Card className="p-5">
            <p className="eyebrow text-fg-subtle">The situation</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {capstone.scenario}
            </p>
          </Card>

          <Card className="overflow-hidden">
            <p className="border-b border-border-base px-5 py-3 eyebrow text-fg-subtle">
              Milestones
            </p>
            <ol>
              {capstone.milestones.map((m, i) => {
                const isDone = completed.has(m.id);
                const isCurrent = i === index;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-border-base px-5 py-3 text-left transition-colors last:border-b-0",
                        isCurrent ? "bg-brand-500/8" : "hover:bg-bg-subtle",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-xs font-extrabold",
                          isDone
                            ? "bg-success text-white"
                            : isCurrent
                              ? "bg-brand-600 text-white"
                              : "bg-bg-inset text-fg-subtle",
                        )}
                      >
                        {isDone ? <Check className="size-3.5" strokeWidth={3.5} /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm font-bold",
                          !isDone && !isCurrent && "text-fg-muted",
                        )}
                      >
                        {m.title}
                      </span>
                      {isCurrent && (
                        <CircleDot className="size-4 shrink-0 text-brand-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card className="p-5">
            <p className="eyebrow text-fg-subtle">Techniques you&rsquo;ll need</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-subtle">
              The shape, not the answer.
            </p>
            <Accordion type="single" collapsible className="mt-2">
              {capstone.briefing.map((note) => (
                <AccordionItem key={note.title} value={note.title}>
                  <AccordionTrigger className="py-3 text-sm">
                    {note.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed">
                      <InlineMarkdown>{note.body}</InlineMarkdown>
                    </p>
                    {note.sql && <CodeBlock className="mt-2" code={note.sql} />}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </aside>

        {/* -------------------------------------------------------- main */}
        <main className="min-w-0 space-y-4">
          {index === 0 && (
            <Card className="p-5">
              <p className="eyebrow text-fg-subtle">The brief</p>
              <div className="mt-2">
                <BriefBlocks blocks={capstone.brief} />
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                Milestone {index + 1} of {total}
              </Badge>
              {completed.has(milestone.id) && (
                <Badge variant="success">
                  <Check />
                  Done
                </Badge>
              )}
              <Badge variant="xp">+{milestone.xp ?? MILESTONE_XP} XP</Badge>
            </div>

            <h2 className="mt-3 text-xl font-extrabold">{milestone.title}</h2>

            <blockquote className="mt-3 border-l-4 border-brand-500/40 pl-4 text-sm leading-relaxed text-fg-muted italic">
              <InlineMarkdown>{milestone.brief}</InlineMarkdown>
            </blockquote>

            <div className="mt-4 rounded-xl border border-border-base bg-bg-subtle p-4">
              <p className="eyebrow text-fg-subtle">What&rsquo;s needed</p>
              <PromptText className="mt-1.5 text-sm font-semibold">
                {milestone.task}
              </PromptText>
            </div>
          </Card>

          {booting ? (
            <Card className="grid place-items-center p-10 text-center">
              <div className="size-20">
                <LottiePlayer
                  name="booting-engine"
                  className="size-full"
                  fallback={<Loader2 className="size-8 animate-spin text-brand-500" />}
                />
              </div>
              <p className="mt-2 text-sm font-bold">{BOOT_MESSAGES[0]}</p>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0 space-y-3">
                <SqlEditor
                  value={sql}
                  onChange={setSql}
                  onSubmit={() => void engine.run(sql)}
                  schema={engine.schema}
                  minHeight="11rem"
                  aria-label={`SQL for ${milestone.title}`}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void engine.run(sql)}
                    disabled={engine.isRunning || !sql.trim()}
                  >
                    <Play />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void check()}
                    disabled={checking || !sql.trim()}
                  >
                    {checking ? <Loader2 className="animate-spin" /> : <Check />}
                    Submit milestone
                  </Button>

                  {(milestone.hints?.length ?? 0) > hintsShown && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHintsShown((n) => n + 1)}
                    >
                      Need a nudge?
                    </Button>
                  )}
                </div>

                {hintsShown > 0 && (
                  <ul className="space-y-2">
                    {milestone.hints?.slice(0, hintsShown).map((hint, i) => (
                      <li
                        key={i}
                        className="animate-slide-up rounded-xl border border-warning/40 bg-warning/8 p-3 text-sm"
                      >
                        <InlineMarkdown>{hint}</InlineMarkdown>
                      </li>
                    ))}
                  </ul>
                )}

                {verdict && (
                  <div
                    className={cn(
                      "animate-slide-up rounded-xl border-2 p-4",
                      verdict.ok
                        ? "border-success/40 bg-success/8"
                        : "border-danger/40 bg-danger/8",
                    )}
                    role="status"
                    aria-live="polite"
                  >
                    <p
                      className={cn(
                        "text-base font-extrabold",
                        verdict.ok ? "text-success" : "text-danger",
                      )}
                    >
                      {verdict.headline}
                    </p>

                    {!verdict.ok && verdict.message && (
                      <p className="mt-1 text-sm leading-relaxed">
                        <InlineMarkdown>{verdict.message}</InlineMarkdown>
                      </p>
                    )}
                    {!verdict.ok && verdict.hint && (
                      <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                        <InlineMarkdown>{verdict.hint}</InlineMarkdown>
                      </p>
                    )}
                    {verdict.ok && milestone.debrief && (
                      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                        <InlineMarkdown>{milestone.debrief}</InlineMarkdown>
                      </p>
                    )}

                    {!verdict.ok && verdict.expected && (
                      <ResultComparison
                        className="mt-3"
                        actual={verdict.actual ?? null}
                        expected={verdict.expected}
                        diffRows={verdict.diffRows}
                      />
                    )}

                    {verdict.ok && index + 1 < total && (
                      <Button
                        size="sm"
                        variant="success"
                        className="mt-3"
                        onClick={() => setIndex(index + 1)}
                      >
                        Next milestone
                        <ArrowRight />
                      </Button>
                    )}
                  </div>
                )}

                <ResultGrid
                  result={engine.result}
                  error={engine.error}
                  emptyMessage="Run your query to see what it returns before submitting."
                  maxHeight="18rem"
                />
              </div>

              <aside className="min-w-0">
                <Tabs defaultValue="schema">
                  <TabsList className="w-full">
                    <TabsTrigger value="schema" className="flex-1">
                      Schema
                    </TabsTrigger>
                    <TabsTrigger value="deliverables" className="flex-1">
                      <ClipboardList />
                      Board
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="schema" className="mt-3">
                    <p className="mb-2 text-xs text-fg-muted">{dataset.description}</p>
                    <SchemaPanel
                      schema={engine.schema}
                      loading={engine.status !== "ready"}
                    />
                  </TabsContent>

                  <TabsContent value="deliverables" className="mt-3 space-y-2">
                    {capstone.milestones.map((m) => {
                      const isDone = completed.has(m.id);
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "rounded-xl border p-3",
                            isDone
                              ? "border-success/35 bg-success/6"
                              : "border-border-base",
                          )}
                        >
                          <p className="flex items-center gap-2 text-sm font-bold">
                            {isDone ? (
                              <Check className="size-4 text-success" strokeWidth={3} />
                            ) : (
                              <Lock className="size-3.5 text-fg-subtle" />
                            )}
                            {m.deliverable?.label ?? m.title}
                          </p>
                          {isDone && record?.submissions[m.id] && (
                            <pre className="mt-2 max-h-24 overflow-auto scroll-thin rounded-lg bg-code-bg p-2 font-mono text-xs leading-relaxed">
                              <code>{record.submissions[m.id]}</code>
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </aside>
            </div>
          )}

          {projectDone && (
            <Card className="border-success/40 bg-success/6 p-6 text-center">
              <Sparkles className="mx-auto size-8 text-success" />
              <h2 className="mt-2 text-2xl font-extrabold">Project delivered</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-fg-muted">
                All {total} milestones complete. Every query on the board is
                yours, reproducible, and agrees with the others — which is the
                actual deliverable.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Button asChild>
                  <Link href="/projects">More projects</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/playground">Keep exploring</Link>
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
