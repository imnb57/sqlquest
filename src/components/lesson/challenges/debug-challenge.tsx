"use client";

import * as React from "react";
import { Bug } from "lucide-react";

import { cn } from "@/lib/utils";
import { CodeBlock } from "../prompt-text";
import type { DebugChallenge } from "@/content/types";
import type { ChallengeHandle, ChallengeViewProps } from "../types";

/**
 * Spot-the-bug challenge: pick the offending line, then see the fix.
 *
 * Reading broken SQL is a distinct skill from writing correct SQL, and it's
 * the one that actually gets exercised on the job.
 */
export const DebugChallengeView = React.forwardRef<
  ChallengeHandle,
  ChallengeViewProps<DebugChallenge>
>(function DebugChallengeView({ challenge, locked, onCanCheckChange }, ref) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  const lines = React.useMemo(() => challenge.brokenSql.split("\n"), [challenge.brokenSql]);

  React.useEffect(() => {
    setSelected(null);
    setRevealed(false);
  }, [challenge.id]);

  React.useEffect(() => {
    onCanCheckChange(selected !== null);
  }, [selected, onCanCheckChange]);

  React.useImperativeHandle(
    ref,
    () => ({
      async check() {
        const correct = selected === challenge.buggyLine;
        setRevealed(true);
        return {
          correct,
          message: correct
            ? undefined
            : `The bug is on line ${challenge.buggyLine + 1}, not line ${(selected ?? 0) + 1}.`,
        };
      },
      reset() {
        setSelected(null);
        setRevealed(false);
      },
      revealAnswer() {
        setSelected(challenge.buggyLine);
        setRevealed(true);
      },
    }),
    [selected, challenge],
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border-base bg-code-bg">
        <div className="flex items-center gap-2 border-b border-border-base bg-bg-subtle px-3 py-2">
          <Bug className="size-4 text-danger" />
          <span className="eyebrow">
            Click the line with the bug
          </span>
        </div>

        <ol>
          {lines.map((line, index) => {
            const isSelected = selected === index;
            const isBug = revealed && index === challenge.buggyLine;
            const isWrongPick = revealed && isSelected && index !== challenge.buggyLine;

            return (
              <li key={index}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && setSelected(index)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-1 text-left font-mono text-sm transition-colors",
                    isBug
                      ? "bg-success/15"
                      : isWrongPick
                        ? "bg-danger/15"
                        : isSelected
                          ? "bg-brand-500/12"
                          : "hover:bg-bg-inset",
                  )}
                >
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums text-fg-subtle select-none">
                    {index + 1}
                  </span>
                  <span className="whitespace-pre">{line || " "}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {revealed && (
        <div className="animate-slide-up">
          <p className="mb-1.5 eyebrow text-success">
            The fix
          </p>
          <CodeBlock code={challenge.fixedSql} />
        </div>
      )}
    </div>
  );
});
