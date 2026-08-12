"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn, seededShuffle, hashToUnit } from "@/lib/utils";
import type { FillBlankChallenge } from "@/content/types";
import type { ChallengeHandle, ChallengeViewProps } from "../types";

/**
 * Fill-in-the-blanks with a word bank.
 *
 * The bank is shuffled deterministically from the challenge id so the layout
 * is stable across a re-render or a refresh — a bank that reshuffles under
 * the learner's cursor feels broken.
 */
export const FillBlankChallengeView = React.forwardRef<
  ChallengeHandle,
  ChallengeViewProps<FillBlankChallenge>
>(function FillBlankChallengeView({ challenge, locked, onCanCheckChange }, ref) {
  const [filled, setFilled] = React.useState<(string | null)[]>(() =>
    challenge.answers.map(() => null),
  );
  const [revealed, setRevealed] = React.useState(false);

  const bank = React.useMemo(
    () =>
      seededShuffle(
        [...challenge.answers, ...(challenge.distractors ?? [])],
        Math.floor(hashToUnit(challenge.id) * 100000) + 1,
      ),
    [challenge.id, challenge.answers, challenge.distractors],
  );

  React.useEffect(() => {
    setFilled(challenge.answers.map(() => null));
    setRevealed(false);
  }, [challenge.id, challenge.answers]);

  React.useEffect(() => {
    onCanCheckChange(filled.every((f) => f !== null));
  }, [filled, onCanCheckChange]);

  /** Places a token into the first empty blank. */
  const place = (token: string) => {
    if (locked) return;
    setFilled((current) => {
      const index = current.findIndex((f) => f === null);
      if (index === -1) return current;
      const next = [...current];
      next[index] = token;
      return next;
    });
  };

  const clear = (index: number) => {
    if (locked) return;
    setFilled((current) => current.map((f, i) => (i === index ? null : f)));
  };

  React.useImperativeHandle(
    ref,
    () => ({
      async check() {
        const correct = filled.every(
          (f, i) => f?.toLowerCase().trim() === challenge.answers[i].toLowerCase().trim(),
        );
        setRevealed(true);
        return {
          correct,
          message: correct ? undefined : "One or more blanks aren't right yet.",
        };
      },
      reset() {
        setFilled(challenge.answers.map(() => null));
        setRevealed(false);
      },
      revealAnswer() {
        setFilled([...challenge.answers]);
        setRevealed(true);
      },
    }),
    [filled, challenge],
  );

  // Split the template on the blank marker, keeping the surrounding SQL intact.
  const segments = challenge.template.split("___");

  // Each token can be used as many times as it appears among the answers.
  const usedCounts = filled.reduce<Record<string, number>>((acc, f) => {
    if (f) acc[f] = (acc[f] ?? 0) + 1;
    return acc;
  }, {});
  const bankCounts = bank.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <pre className="overflow-x-auto scroll-thin rounded-xl border border-border-base bg-code-bg p-4 font-mono text-sm leading-loose whitespace-pre-wrap">
        {segments.map((segment, i) => (
          <React.Fragment key={i}>
            {segment}
            {i < segments.length - 1 && (
              <button
                type="button"
                onClick={() => clear(i)}
                disabled={locked || filled[i] === null}
                className={cn(
                  "mx-0.5 inline-flex min-w-24 items-center justify-center gap-1 rounded-lg border-2 border-dashed px-2 py-0.5 align-middle font-bold transition-colors",
                  filled[i] === null
                    ? "border-border-strong text-fg-subtle"
                    : revealed
                      ? filled[i]?.toLowerCase() === challenge.answers[i].toLowerCase()
                        ? "border-success bg-success/12 text-success"
                        : "border-danger bg-danger/12 text-danger"
                      : "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300",
                )}
                aria-label={
                  filled[i] ? `Blank ${i + 1}: ${filled[i]}, click to clear` : `Blank ${i + 1}, empty`
                }
              >
                {filled[i] ?? " ".repeat(6)}
                {filled[i] && !locked && <X className="size-3" />}
              </button>
            )}
          </React.Fragment>
        ))}
      </pre>

      <div>
        <p className="mb-2 eyebrow text-fg-subtle">
          Word bank
        </p>
        <div className="flex flex-wrap gap-2">
          {bank.map((token, i) => {
            const exhausted = (usedCounts[token] ?? 0) >= (bankCounts[token] ?? 0);
            return (
              <button
                key={`${token}-${i}`}
                type="button"
                onClick={() => place(token)}
                disabled={locked || exhausted || filled.every((f) => f !== null)}
                className={cn(
                  "btn-3d rounded-xl border-2 px-3.5 py-2 font-mono text-sm font-bold transition-all",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  exhausted
                    ? "border-border-base bg-bg-inset text-fg-subtle opacity-45"
                    : "border-border-strong bg-bg-elevated shadow-[0_3px_0_0_var(--border)] hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-300",
                )}
              >
                {token}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
