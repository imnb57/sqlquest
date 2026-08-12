"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useProgressStore } from "@/stores/progress-store";

/**
 * Progress strip on a project card.
 *
 * Split into its own client component so the projects index itself can stay a
 * server component — the cards, briefs and metadata all render as static HTML,
 * and only this strip hydrates.
 */
export function CapstoneProgressPill({
  capstoneId,
  total,
  className,
}: {
  capstoneId: string;
  total: number;
  className?: string;
}) {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const record = useProgressStore((s) => s.capstones[capstoneId]);

  if (!hasHydrated) {
    return <div className={cn("h-9 rounded-xl bg-bg-inset shimmer", className)} />;
  }

  const done = record?.completed.length ?? 0;
  if (done === 0) return null;

  const complete = done >= total;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
        <span className={complete ? "text-success" : "text-fg-muted"}>
          {complete ? "Delivered" : "In progress"}
        </span>
        <span className="tabular-nums text-fg-subtle">
          {done}/{total} milestones
        </span>
      </div>
      <Progress
        value={done}
        max={total}
        size="sm"
        tone={complete ? "success" : "brand"}
        label="Project progress"
      />
    </div>
  );
}
