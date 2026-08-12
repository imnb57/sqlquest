"use client";

import * as React from "react";
import { Play, RotateCcw, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SqlEditor } from "@/components/sql/sql-editor";
import { ResultGrid, ResultComparison } from "@/components/sql/result-grid";
import { formatSql } from "@/lib/sql/statement";
import { useSettingsStore } from "@/stores/settings-store";
import type { QueryChallenge } from "@/content/types";
import type { ChallengeHandle, ChallengeViewProps } from "../types";

/**
 * Write-SQL challenge.
 *
 * "Run" executes without grading so learners can explore freely; "Check" runs
 * the grader, which executes both the submission and the reference solution
 * against identical database state and compares the result sets.
 */
export const QueryChallengeView = React.forwardRef<
  ChallengeHandle,
  ChallengeViewProps<QueryChallenge>
>(function QueryChallengeView(
  { challenge, locked, onCanCheckChange, engine, schema },
  ref,
) {
  const hardMode = useSettingsStore((s) => s.hardMode);
  const showExpected = useSettingsStore((s) => s.showExpectedOnFail);
  const autoFormat = useSettingsStore((s) => s.autoFormatOnRun);

  const [value, setValue] = React.useState(() =>
    hardMode ? "" : (challenge.starter ?? ""),
  );

  // A new challenge id means a fresh editor; keying on it in the parent would
  // remount the whole panel and lose the engine's warm state.
  React.useEffect(() => {
    setValue(hardMode ? "" : (challenge.starter ?? ""));
  }, [challenge.id, challenge.starter, hardMode]);

  React.useEffect(() => {
    onCanCheckChange(value.trim().length > 0);
  }, [value, onCanCheckChange]);

  const runOnly = React.useCallback(async () => {
    if (!value.trim()) return;
    if (autoFormat) setValue((v) => formatSql(v));
    await engine.run(value);
  }, [value, engine, autoFormat]);

  React.useImperativeHandle(
    ref,
    () => ({
      async check() {
        const outcome = await engine.grade(
          value,
          challenge.solution,
          challenge.grading,
          challenge.verifyQuery,
        );

        return {
          correct: outcome.correct,
          message: outcome.correct ? undefined : outcome.message,
          hint: outcome.hint,
          detail:
            !outcome.correct &&
            showExpected &&
            outcome.expected &&
            outcome.verdict !== "error" ? (
              <ResultComparison
                actual={outcome.actual ?? null}
                expected={outcome.expected}
                diffRows={outcome.diffRows}
              />
            ) : undefined,
        };
      },
      reset() {
        /* Keep the learner's attempt so they can edit rather than retype. */
      },
      revealAnswer() {
        setValue(formatSql(challenge.solution));
      },
    }),
    [value, challenge, engine, showExpected],
  );

  const busy = engine.isRunning || engine.status !== "ready";

  return (
    <div className="space-y-3">
      <SqlEditor
        value={value}
        onChange={setValue}
        onSubmit={runOnly}
        schema={schema}
        readOnly={locked}
        autoFocus
        minHeight="8.5rem"
        aria-label="Write your SQL query"
        placeholder={hardMode ? "Write your query…" : "SELECT ..."}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={runOnly}
          disabled={busy || locked || !value.trim()}
        >
          <Play />
          Run
          <kbd className="ml-1 hidden rounded border border-border-strong px-1 font-mono text-2xs sm:inline">
            ⌘↵
          </kbd>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setValue(formatSql(value))}
          disabled={locked || !value.trim()}
        >
          <Wand2 />
          Format
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void engine.reset()}
          disabled={busy}
          title="Restore the dataset to its original state"
        >
          <RotateCcw />
          Reset data
        </Button>
      </div>

      <ResultGrid
        result={engine.result}
        error={engine.error}
        emptyMessage="Hit Run to try your query without submitting it."
        maxHeight="16rem"
      />
    </div>
  );
});
