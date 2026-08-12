"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Heart,
  Lightbulb,
  Loader2,
  SkipForward,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SchemaPanel } from "@/components/sql/schema-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LottiePlayer } from "@/components/animation/lottie";

import { useSqlEngine } from "@/hooks/use-sql-engine";
import { useProgressStore, useHearts } from "@/stores/progress-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  celebrateCorrect,
  celebrateWrong,
  fireConfetti,
  playSound,
} from "@/lib/feedback";
import { praiseFor, nudge, BOOT_MESSAGES } from "@/lib/copy";
import { challengeXp, type LessonRef } from "@/content/types";
import { getDataset } from "@/content/datasets";
import { MAX_HEARTS } from "@/lib/gamification/hearts";

import { ChallengeRenderer, CHALLENGE_TYPE_LABEL } from "./challenges";
import { ConceptIntro } from "./concept-intro";
import { LessonSummary } from "./lesson-summary";
import { PromptText, InlineMarkdown } from "./prompt-text";
import type { ChallengeHandle, ChallengeCheckResult } from "./types";
import type { LessonCompletionSummary } from "@/stores/progress-store";

/**
 * The lesson loop.
 *
 * Phases: concepts → one challenge at a time → summary. The player owns
 * everything shared across challenge types — progress, hearts, hints, XP,
 * feedback and animation — so adding a new challenge type only means writing
 * its answer UI.
 */

type Phase = "intro" | "playing" | "summary";
type AnswerState = "answering" | "checking" | "correct" | "wrong";

export function LessonPlayer({
  lessonRef,
  next,
}: {
  lessonRef: LessonRef;
  next?: LessonRef;
}) {
  const { lesson, unit, track } = lessonRef;
  const router = useRouter();

  const engine = useSqlEngine(lesson.datasetId);
  const dataset = React.useMemo(() => getDataset(lesson.datasetId), [lesson.datasetId]);

  const heartsEnabled = useSettingsStore((s) => s.heartsEnabled);
  const autoAdvance = useSettingsStore((s) => s.autoAdvance);
  const hearts = useHearts();

  const startLesson = useProgressStore((s) => s.startLesson);
  const recordChallenge = useProgressStore((s) => s.recordChallenge);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const solvedIds = useProgressStore(
    (s) => s.lessons[lesson.id]?.solved ?? EMPTY_ARRAY,
  );

  const [phase, setPhase] = React.useState<Phase>("intro");
  const [index, setIndex] = React.useState(0);
  const [answerState, setAnswerState] = React.useState<AnswerState>("answering");
  const [feedback, setFeedback] = React.useState<ChallengeCheckResult | null>(null);
  const [canCheck, setCanCheck] = React.useState(false);
  const [hintsShown, setHintsShown] = React.useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = React.useState(0);
  const [attemptedThisChallenge, setAttemptedThisChallenge] = React.useState(false);
  const [totalHints, setTotalHints] = React.useState(0);
  const [summary, setSummary] = React.useState<LessonCompletionSummary | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [exitOpen, setExitOpen] = React.useState(false);
  const [outOfHearts, setOutOfHearts] = React.useState(false);

  const challengeRef = React.useRef<ChallengeHandle>(null);
  // Clocks start at zero and are stamped from event handlers, never during
  // render — `Date.now()` in a render body makes the component impure.
  const startedAt = React.useRef(0);
  const challengeStartedAt = React.useRef(0);

  const challenge = lesson.challenges[index];
  const total = lesson.challenges.length;
  const progressPct = (index / total) * 100;

  /* -- per-challenge reset ------------------------------------------------ */

  // Resetting derived state when `index` changes is done during render rather
  // than in an effect: React's documented pattern for "adjust state when a
  // value changes", and it avoids rendering the new challenge for one frame
  // with the previous challenge's hint count still showing.
  const [renderedIndex, setRenderedIndex] = React.useState(index);
  if (renderedIndex !== index) {
    setRenderedIndex(index);
    setCanCheck(false);
    setHintsShown(0);
    setAttemptedThisChallenge(false);
  }

  // Warn on accidental navigation away from a lesson in progress.
  React.useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  /* -- actions ----------------------------------------------------------- */

  const handleCheck = React.useCallback(async () => {
    if (!challengeRef.current || answerState !== "answering") return;
    setAnswerState("checking");

    const result = await challengeRef.current.check();
    const durationMs = Date.now() - challengeStartedAt.current;

    const outcome = recordChallenge({
      lessonId: lesson.id,
      challengeId: challenge.id,
      correct: result.correct,
      hintsUsed: hintsShown,
      durationMs,
      baseXp: challengeXp(challenge, lesson.difficulty),
      costsHearts: heartsEnabled,
    });

    // The headline is chosen once, here — not during render, or it would
    // reshuffle every time the component re-paints while you're reading it.
    setFeedback({
      ...result,
      headline: result.correct
        ? praiseFor(outcome.newCombo, challenge.difficulty === "hard" || challenge.difficulty === "expert")
        : nudge(),
    });
    setAnswerState(result.correct ? "correct" : "wrong");

    if (result.correct) {
      if (!attemptedThisChallenge && hintsShown === 0) {
        setFirstTryCorrect((n) => n + 1);
      }
      celebrateCorrect(outcome.newCombo);

      if (outcome.leveledUpTo) {
        playSound("levelUp");
        toast.success(`Level ${outcome.leveledUpTo}!`, {
          description: "Your rank just went up.",
        });
      }
      for (const achievement of outcome.unlocked) {
        toast.success(`${achievement.glyph} ${achievement.title}`, {
          description: achievement.description,
        });
      }
    } else {
      setAttemptedThisChallenge(true);
      celebrateWrong();
      if (heartsEnabled && outcome.heartsRemaining <= 0) setOutOfHearts(true);
    }
  }, [
    answerState,
    challenge,
    lesson.id,
    lesson.difficulty,
    hintsShown,
    heartsEnabled,
    attemptedThisChallenge,
    recordChallenge,
  ]);

  const finishLesson = React.useCallback(() => {
    const secondsSpent = Math.round((Date.now() - startedAt.current) / 1000);
    setElapsedSeconds(secondsSpent);
    const result = completeLesson({
      lessonId: lesson.id,
      isBoss: lesson.kind === "boss",
      trackId: track.id,
      secondsSpent,
      totalChallenges: total,
      firstTryCorrect,
      hintsUsed: totalHints,
    });
    setSummary(result);
    setPhase("summary");
    playSound("complete");
    void fireConfetti(result.perfect ? "large" : "medium");
  }, [completeLesson, lesson, track.id, total, firstTryCorrect, totalHints]);

  const handleContinue = React.useCallback(() => {
    setFeedback(null);

    if (answerState === "wrong") {
      // Retry the same challenge rather than moving on — the point is to
      // actually learn it, and the XP is already forfeit for first-try credit.
      setAnswerState("answering");
      challengeRef.current?.reset();
      return;
    }

    if (index + 1 >= total) {
      finishLesson();
      return;
    }

    challengeStartedAt.current = Date.now();
    setIndex((i) => i + 1);
    setAnswerState("answering");
  }, [answerState, index, total, finishLesson]);

  const handleSkip = React.useCallback(() => {
    challengeRef.current?.revealAnswer?.();
    setAnswerState("wrong");
    setFeedback({
      correct: false,
      message: "Skipped — here's the answer.",
      hint: "Come back to this one in Practice later.",
    });
    setAttemptedThisChallenge(true);
  }, []);

  const revealHint = React.useCallback(() => {
    const hints = challenge.hints ?? [];
    if (hintsShown >= hints.length) return;
    setHintsShown((n) => n + 1);
    setTotalHints((n) => n + 1);
    playSound("tick");
  }, [challenge.hints, hintsShown]);

  // Enter advances when feedback is showing; ⌘/Ctrl+Enter checks the answer.
  React.useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (answerState === "correct" || answerState === "wrong") {
        e.preventDefault();
        handleContinue();
      } else if ((e.metaKey || e.ctrlKey) && canCheck) {
        e.preventDefault();
        void handleCheck();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answerState, canCheck, handleContinue, handleCheck]);

  /* -- render ------------------------------------------------------------ */

  if (phase === "intro") {
    return (
      <ConceptIntro
        lesson={lesson}
        unit={unit}
        track={track}
        resumeCount={solvedIds.length}
        onStart={() => {
          // Both clocks and the "started" record are stamped from this event
          // rather than an effect: the lesson genuinely begins on this click,
          // not when the intro screen mounted.
          const now = Date.now();
          startedAt.current = now;
          challengeStartedAt.current = now;
          startLesson(lesson.id);
          setPhase("playing");
        }}
      />
    );
  }

  if (phase === "summary" && summary) {
    return (
      <LessonSummary
        summary={summary}
        lessonRef={lessonRef}
        next={next}
        secondsSpent={elapsedSeconds}
        onReplay={() => {
          setPhase("intro");
          setIndex(0);
          setAnswerState("answering");
          setFeedback(null);
          setSummary(null);
          setFirstTryCorrect(0);
          setTotalHints(0);
          setElapsedSeconds(0);
          startedAt.current = Date.now();
        }}
      />
    );
  }

  const hints = challenge.hints ?? [];
  const booting = engine.status === "booting" || engine.status === "seeding";
  const needsEngine = challenge.type === "query";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar: exit, progress, hearts */}
      <header className="sticky top-0 z-30 border-b border-border-base bg-bg/90 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            aria-label="Exit lesson"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-fg-subtle transition-colors hover:bg-bg-inset hover:text-fg"
          >
            <X className="size-5" />
          </button>

          <Progress
            value={progressPct}
            tone="success"
            size="md"
            striped
            label={`Challenge ${index + 1} of ${total}`}
            className="flex-1"
          />

          <span className="shrink-0 text-xs font-extrabold tabular-nums text-fg-subtle">
            {index + 1}/{total}
          </span>

          {heartsEnabled && (
            <span
              className="flex shrink-0 items-center gap-1 text-sm font-extrabold text-heart"
              aria-label={`${hearts.hearts} of ${MAX_HEARTS} hearts remaining`}
            >
              <Heart
                className={cn("size-5", hearts.hearts > 0 && "fill-current")}
              />
              {hearts.hearts}
            </span>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-56">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="neutral" size="sm">
            {CHALLENGE_TYPE_LABEL[challenge.type]}
          </Badge>
          {challenge.difficulty && (
            <Badge
              size="sm"
              variant={
                challenge.difficulty === "easy"
                  ? "success"
                  : challenge.difficulty === "medium"
                    ? "warning"
                    : "danger"
              }
            >
              {challenge.difficulty}
            </Badge>
          )}
          <Badge variant="xp" size="sm">
            +{challengeXp(challenge, lesson.difficulty)} XP
          </Badge>
        </div>

        <PromptText className="text-lg font-semibold sm:text-xl">
          {challenge.prompt}
        </PromptText>

        {needsEngine && booting ? (
          <EngineBooting />
        ) : (
          <div
            className={cn(
              "mt-6 grid gap-6",
              needsEngine && "lg:grid-cols-[minmax(0,1fr)_18rem]",
            )}
          >
            <div className="min-w-0">
              <ChallengeRenderer
                key={challenge.id}
                ref={challengeRef}
                challenge={challenge}
                locked={answerState !== "answering"}
                onCanCheckChange={setCanCheck}
                engine={engine}
                schema={engine.schema}
                hintsUsed={hintsShown}
              />
            </div>

            {needsEngine && (
              <aside className="min-w-0">
                <Tabs defaultValue="schema">
                  <TabsList className="w-full">
                    <TabsTrigger value="schema" className="flex-1">
                      Schema
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex-1">
                      Dataset
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="schema" className="mt-3">
                    <SchemaPanel
                      schema={engine.schema}
                      loading={engine.status !== "ready"}
                    />
                  </TabsContent>
                  <TabsContent value="about" className="mt-3">
                    <div className="rounded-xl border border-border-base p-4">
                      <h3 className="text-sm font-extrabold">{dataset.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                        {dataset.description}
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {dataset.tables.map((t) => (
                          <li key={t.name} className="text-xs">
                            <code className="font-mono font-bold text-brand-600 dark:text-brand-300">
                              {t.name}
                            </code>
                            <span className="text-fg-muted"> — {t.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </aside>
            )}
          </div>
        )}

        {/* Hints */}
        {hints.length > 0 && answerState === "answering" && (
          <div className="mt-6">
            {hintsShown > 0 && (
              <ul className="mb-3 space-y-2">
                {hints.slice(0, hintsShown).map((hint, i) => (
                  <li
                    key={i}
                    className="animate-slide-up rounded-xl border border-warning/40 bg-warning/8 p-3.5 text-sm leading-relaxed"
                  >
                    <span className="mr-1.5 font-extrabold text-warning">
                      Hint {i + 1}:
                    </span>
                    <InlineMarkdown>{hint}</InlineMarkdown>
                  </li>
                ))}
              </ul>
            )}
            {hintsShown < hints.length && (
              <Button variant="ghost" size="sm" onClick={revealHint}>
                <Lightbulb />
                {hintsShown === 0 ? "Need a hint?" : "Another hint"}
                <span className="text-fg-subtle">
                  ({hints.length - hintsShown} left)
                </span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Feedback bar */}
      <FeedbackBar
        state={answerState}
        feedback={feedback}
        explanation={challenge.explanation}
        canCheck={canCheck}
        isLast={index + 1 >= total}
        onCheck={handleCheck}
        onContinue={handleContinue}
        onSkip={handleSkip}
        autoAdvance={autoAdvance}
      />

      {/* Exit confirmation */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this lesson?</DialogTitle>
            <DialogDescription>
              Your solved challenges are saved, so you can pick up where you left
              off. You&rsquo;ve done {index} of {total} so far.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExitOpen(false)}>
              Keep learning
            </Button>
            <Button variant="danger" onClick={() => router.push("/learn")}>
              Leave lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Out of hearts */}
      <OutOfHeartsDialog
        open={outOfHearts}
        onOpenChange={setOutOfHearts}
        lessonMinutes={lesson.estimatedMinutes}
      />
    </div>
  );
}

const EMPTY_ARRAY: string[] = [];

/* --------------------------------------------------------------- helpers */

function EngineBooting() {
  // A multi-second wait with one static line reads as "stuck". Cycling through
  // what's actually happening reads as "deliberate" — and teaches something.
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(
      () => setStep((n) => Math.min(n + 1, BOOT_MESSAGES.length - 1)),
      1800,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-8 grid place-items-center rounded-2xl border-2 border-dashed border-border-base p-10 text-center">
      <div className="size-24">
        <LottiePlayer
          name="booting-engine"
          className="size-full"
          fallback={<Loader2 className="size-10 animate-spin text-brand-500" />}
        />
      </div>
      <p
        key={step}
        className="mt-3 animate-slide-up text-sm font-bold"
        role="status"
        aria-live="polite"
      >
        {BOOT_MESSAGES[step]}
      </p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-fg-muted">
        Nothing you write leaves this device. This only happens once per session.
      </p>
    </div>
  );
}

function FeedbackBar({
  state,
  feedback,
  explanation,
  canCheck,
  isLast,
  onCheck,
  onContinue,
  onSkip,
  autoAdvance,
}: {
  state: AnswerState;
  feedback: ChallengeCheckResult | null;
  explanation?: string;
  canCheck: boolean;
  isLast: boolean;
  onCheck: () => void;
  onContinue: () => void;
  onSkip: () => void;
  autoAdvance: boolean;
}) {
  const settled = state === "correct" || state === "wrong";
  const correct = state === "correct";

  // Auto-advance only on success, and only after long enough to read the
  // explanation — never skip past a mistake the learner needs to absorb.
  React.useEffect(() => {
    if (!autoAdvance || !correct || explanation) return;
    const id = setTimeout(onContinue, 1100);
    return () => clearTimeout(id);
  }, [autoAdvance, correct, explanation, onContinue]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t-2 transition-colors duration-200",
        settled
          ? correct
            ? "border-success/40 bg-success-soft dark:bg-success/12"
            : "border-danger/40 bg-danger-soft dark:bg-danger/12"
          : "border-border-base bg-bg/95 backdrop-blur-lg",
      )}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {settled && (
          <div
            className={cn("mb-3 flex items-start gap-3", correct && "animate-pop")}
            role="status"
            aria-live="polite"
          >
            <div className="size-10 shrink-0">
              <LottiePlayer
                name={correct ? "correct-check" : "wrong-cross"}
                loop={false}
                className="size-full"
                fallback={
                  <span className="text-2xl">{correct ? "✅" : "❌"}</span>
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-lg font-extrabold",
                  correct ? "text-success" : "text-danger",
                )}
              >
                {feedback?.headline ?? (correct ? "Correct" : "Not quite")}
              </p>
              {!correct && feedback?.message && (
                <p className="mt-1 text-sm leading-relaxed text-fg">
                  <InlineMarkdown>{feedback.message}</InlineMarkdown>
                </p>
              )}
              {feedback?.hint && (
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                  <InlineMarkdown>{feedback.hint}</InlineMarkdown>
                </p>
              )}
              {explanation && (
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  <InlineMarkdown>{explanation}</InlineMarkdown>
                </p>
              )}
            </div>
          </div>
        )}

        {settled && feedback?.detail && (
          <div className="mb-3 max-h-64 overflow-auto scroll-thin">
            {feedback.detail}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {!settled && (
            <Button
              variant="ghost"
              size="lg"
              onClick={onSkip}
              className="hidden sm:inline-flex"
            >
              <SkipForward />
              Skip
            </Button>
          )}

          <div className="flex-1" />

          {settled ? (
            <Button
              size="lg"
              variant={correct ? "success" : "danger"}
              uppercase
              onClick={onContinue}
              className="min-w-40"
              autoFocus
            >
              {correct ? (isLast ? "Finish" : "Continue") : "Try again"}
              <ArrowRight />
            </Button>
          ) : (
            <Button
              size="lg"
              uppercase
              onClick={onCheck}
              disabled={!canCheck || state === "checking"}
              className="min-w-40"
            >
              {state === "checking" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Checking
                </>
              ) : (
                <>
                  <Check />
                  Check
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OutOfHeartsDialog({
  open,
  onOpenChange,
  lessonMinutes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonMinutes: number;
}) {
  const gems = useProgressStore((s) => s.gems);
  const refillHearts = useProgressStore((s) => s.refillHearts);
  const disableHearts = useSettingsStore((s) => s.set);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="size-5 fill-current text-heart" />
            Out of hearts
          </DialogTitle>
          <DialogDescription>
            Hearts refill on their own — one every 20 minutes. You can keep
            going right now by spending gems, or switch hearts off entirely if
            they&rsquo;re getting in the way of learning.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-fg-muted">
          This lesson takes about {formatDuration(lessonMinutes)}.{" "}
          <Link href="/practice" className="font-bold text-brand-500 hover:underline">
            Practice mode
          </Link>{" "}
          never uses hearts.
        </p>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              disableHearts("heartsEnabled", false);
              onOpenChange(false);
              toast.info("Hearts turned off", {
                description: "You can re-enable them in Settings → Learning.",
              });
            }}
          >
            Turn hearts off
          </Button>
          <Button
            variant="accent"
            disabled={gems < 30}
            onClick={() => {
              if (refillHearts()) {
                playSound("unlock");
                onOpenChange(false);
              }
            }}
          >
            Refill for 30 💎
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
