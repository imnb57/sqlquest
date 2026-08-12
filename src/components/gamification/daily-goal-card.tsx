"use client";

import * as React from "react";
import { Check, Gem, Target, Zap } from "lucide-react";
import { toast } from "sonner";

import { cn, localDayKey } from "@/lib/utils";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDailyQuests, useProgressStore } from "@/stores/progress-store";
import { playSound, fireConfetti } from "@/lib/feedback";

/** Today's XP target with a ring, plus the three rotating daily quests. */
export function DailyGoalCard({ className }: { className?: string }) {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const goal = useProgressStore((s) => s.dailyGoal);
  const counters = useProgressStore((s) => s.counters);
  const countersDay = useProgressStore((s) => s.countersDay);

  const xpToday = countersDay === localDayKey() ? counters.xpToday : 0;
  const met = xpToday >= goal;

  if (!hasHydrated) {
    return <div className={cn("h-48 rounded-2xl bg-bg-inset shimmer", className)} />;
  }

  return (
    <div className={cn("card-surface overflow-hidden", className)}>
      <div className="flex items-center gap-4 p-5">
        <ProgressRing
          value={xpToday}
          max={goal}
          size={68}
          stroke={7}
          tone={met ? "var(--color-success)" : "var(--color-xp)"}
        >
          {met ? (
            <Check className="size-7 text-success" strokeWidth={3.5} />
          ) : (
            <span className="text-sm font-extrabold tabular-nums">
              {Math.round((xpToday / goal) * 100)}%
            </span>
          )}
        </ProgressRing>

        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 section-label">
            <Target className="size-4 text-brand-500" />
            Daily goal
          </h3>
          <p className="mt-1 text-sm text-fg-muted">
            {met ? (
              <span className="font-bold text-success">Goal smashed today 🎉</span>
            ) : (
              <>
                <span className="font-extrabold text-fg tabular-nums">
                  {xpToday}
                </span>
                <span className="text-fg-subtle"> / {goal} XP</span>
                {" — "}
                {goal - xpToday} to go
              </>
            )}
          </p>
        </div>
      </div>

      <DailyQuests />
    </div>
  );
}

export function DailyQuests({ className }: { className?: string }) {
  const quests = useDailyQuests();
  const claimed = useProgressStore((s) => s.claimedQuests);
  const claimQuest = useProgressStore((s) => s.claimQuest);

  const onClaim = React.useCallback(
    (id: string, gems: number, xp: number) => {
      if (!claimQuest(id)) return;
      playSound("unlock");
      void fireConfetti("small");
      toast.success("Quest complete!", {
        description: `+${gems} gems · +${xp} XP`,
      });
    },
    [claimQuest],
  );

  return (
    <div className={cn("border-t border-border-base", className)}>
      <h3 className="px-5 pt-4 eyebrow text-fg-subtle">
        Daily quests
      </h3>
      <ul className="divide-y divide-border-base">
        {quests.map((q) => {
          const isClaimed = claimed.includes(q.id);
          return (
            <li key={q.id} className="flex items-center gap-3 px-5 py-3.5">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl text-lg",
                  q.complete ? "bg-success/15" : "bg-bg-inset",
                )}
              >
                {q.glyph}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{q.description}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress
                    value={q.percent}
                    size="xs"
                    tone={q.complete ? "success" : "brand"}
                    className="flex-1"
                    label={q.description}
                  />
                  <span className="text-xs font-bold tabular-nums text-fg-subtle">
                    {q.progress}/{q.goal}
                  </span>
                </div>
              </div>

              {q.complete && !isClaimed ? (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => onClaim(q.id, q.gemReward, q.xpReward)}
                >
                  <Gem className="size-3.5" />
                  Claim
                </Button>
              ) : isClaimed ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-success">
                  <Check className="size-4" strokeWidth={3} />
                  Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-fg-subtle tabular-nums">
                  <Zap className="size-3.5" />
                  {q.xpReward}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
