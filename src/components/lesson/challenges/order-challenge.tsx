"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

import { cn, seededShuffle, hashToUnit } from "@/lib/utils";
import type { OrderChallenge } from "@/content/types";
import type { ChallengeHandle, ChallengeViewProps } from "../types";

/**
 * Reorder-the-clauses challenge.
 *
 * Uses native HTML5 drag-and-drop *and* explicit up/down buttons. The buttons
 * aren't a fallback — they're the accessible path, and they're what most
 * people reach for on a phone.
 */
export const OrderChallengeView = React.forwardRef<
  ChallengeHandle,
  ChallengeViewProps<OrderChallenge>
>(function OrderChallengeView({ challenge, locked, onCanCheckChange }, ref) {
  const shuffled = React.useMemo(() => {
    const seed = Math.floor(hashToUnit(challenge.id) * 100000) + 7;
    let candidate = seededShuffle(challenge.items, seed);
    // A "shuffle" that returns the original order gives the answer away.
    if (candidate.join("|") === challenge.items.join("|")) {
      candidate = seededShuffle(challenge.items, seed + 13);
    }
    return candidate;
  }, [challenge.id, challenge.items]);

  const [items, setItems] = React.useState<string[]>(shuffled);
  const [revealed, setRevealed] = React.useState(false);
  const dragIndex = React.useRef<number | null>(null);

  React.useEffect(() => {
    setItems(shuffled);
    setRevealed(false);
  }, [shuffled]);

  React.useEffect(() => {
    onCanCheckChange(true);
  }, [onCanCheckChange]);

  const move = (from: number, to: number) => {
    if (locked || to < 0 || to >= items.length) return;
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  React.useImperativeHandle(
    ref,
    () => ({
      async check() {
        const correct = items.every((item, i) => item === challenge.items[i]);
        setRevealed(true);
        return {
          correct,
          message: correct ? undefined : "Close — the order isn't right yet.",
        };
      },
      reset() {
        setRevealed(false);
      },
      revealAnswer() {
        setItems([...challenge.items]);
        setRevealed(true);
      },
    }),
    [items, challenge],
  );

  return (
    <ol className="space-y-2">
      {items.map((item, index) => {
        const inPlace = revealed && item === challenge.items[index];
        const outOfPlace = revealed && item !== challenge.items[index];

        return (
          <li
            key={item}
            draggable={!locked}
            onDragStart={() => (dragIndex.current = index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex.current !== null) move(dragIndex.current, index);
              dragIndex.current = null;
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl border-2 bg-bg-elevated p-2.5 transition-colors",
              locked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
              inPlace
                ? "border-success bg-success/8"
                : outOfPlace
                  ? "border-danger bg-danger/8"
                  : "border-border-base hover:border-border-strong",
            )}
          >
            <GripVertical className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-bg-inset text-xs font-extrabold tabular-nums">
              {index + 1}
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold">
              {item}
            </code>

            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={locked || index === 0}
                aria-label={`Move "${item}" up`}
                className="grid size-5 place-items-center rounded text-fg-subtle transition-colors hover:bg-bg-inset hover:text-fg disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={locked || index === items.length - 1}
                aria-label={`Move "${item}" down`}
                className="grid size-5 place-items-center rounded text-fg-subtle transition-colors hover:bg-bg-inset hover:text-fg disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
});
