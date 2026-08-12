"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { CodeBlock, InlineMarkdown } from "../prompt-text";
import type { ChoiceChallenge, PredictChallenge } from "@/content/types";
import type { ChallengeHandle, ChallengeViewProps } from "../types";

/**
 * Multiple-choice, shared by `choice` and `predict` challenges. `predict`
 * additionally shows the query the learner is reasoning about.
 */
export const ChoiceChallengeView = React.forwardRef<
  ChallengeHandle,
  ChallengeViewProps<ChoiceChallenge | PredictChallenge>
>(function ChoiceChallengeView({ challenge, locked, onCanCheckChange }, ref) {
  const multiple = challenge.type === "choice" && challenge.multiple === true;
  const [selected, setSelected] = React.useState<string[]>([]);
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    setSelected([]);
    setRevealed(false);
  }, [challenge.id]);

  React.useEffect(() => {
    onCanCheckChange(selected.length > 0);
  }, [selected, onCanCheckChange]);

  const toggle = (id: string) => {
    if (locked) return;
    setSelected((current) =>
      multiple
        ? current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id]
        : [id],
    );
  };

  React.useImperativeHandle(
    ref,
    () => ({
      async check() {
        const correct =
          selected.length === challenge.correct.length &&
          selected.every((id) => challenge.correct.includes(id));
        setRevealed(true);
        return {
          correct,
          message: correct ? undefined : "Not quite — look at the highlighted answer.",
        };
      },
      reset() {
        setSelected([]);
        setRevealed(false);
      },
      revealAnswer() {
        setSelected([...challenge.correct]);
        setRevealed(true);
      },
    }),
    [selected, challenge],
  );

  return (
    <div className="space-y-4">
      {challenge.type === "predict" && (
        <CodeBlock code={challenge.query} caption="What does this return?" />
      )}

      <div
        role={multiple ? "group" : "radiogroup"}
        aria-label="Answer options"
        className="grid gap-2.5 sm:grid-cols-2"
      >
        {challenge.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isCorrect = challenge.correct.includes(option.id);
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isSelected && !isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={isSelected}
              disabled={locked}
              onClick={() => toggle(option.id)}
              className={cn(
                "btn-3d group relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                showCorrect
                  ? "border-success bg-success/10 shadow-[0_3px_0_0_var(--color-success)]"
                  : showWrong
                    ? "border-danger bg-danger/10 shadow-[0_3px_0_0_var(--color-danger)]"
                    : isSelected
                      ? "border-brand-500 bg-brand-500/8 shadow-[0_3px_0_0_var(--color-brand-500)]"
                      : "border-border-base bg-bg-elevated shadow-[0_3px_0_0_var(--border)] hover:border-border-strong hover:bg-bg-subtle",
                locked && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                  multiple ? "rounded-md" : "rounded-full",
                  showCorrect
                    ? "border-success bg-success text-white"
                    : showWrong
                      ? "border-danger bg-danger text-white"
                      : isSelected
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-border-strong",
                )}
              >
                {(isSelected || showCorrect) && (
                  <Check className="size-3" strokeWidth={4} />
                )}
              </span>

              <span
                className={cn(
                  "min-w-0 flex-1 text-sm leading-relaxed font-semibold",
                  option.code && "font-mono",
                )}
              >
                {option.code ? option.label : <InlineMarkdown>{option.label}</InlineMarkdown>}
              </span>
            </button>
          );
        })}
      </div>

      {multiple && (
        <p className="text-xs font-semibold text-fg-subtle">
          Select all that apply.
        </p>
      )}
    </div>
  );
});
