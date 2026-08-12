"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Gem, Heart, Zap } from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import { Tooltip } from "@/components/ui/overlays";
import { Progress } from "@/components/ui/progress";
import { useHearts, useLevel, useProgressStore } from "@/stores/progress-store";
import { MAX_HEARTS, formatHeartTimer } from "@/lib/gamification/hearts";
import { LottiePlayer } from "@/components/animation/lottie";

/**
 * The persistent stats bar: streak, XP/level, gems and hearts.
 *
 * Reads straight from the Zustand store, so it updates the instant a learner
 * answers a question — no revalidation, no loading state.
 */

function StatPill({
  icon,
  value,
  label,
  tone,
  href,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone: string;
  href?: string;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-extrabold tabular-nums transition-colors",
        "hover:bg-bg-inset",
        tone,
      )}
    >
      {icon}
      {value}
    </span>
  );

  return (
    <Tooltip label={label}>
      {href ? (
        <Link href={href} aria-label={label}>
          {content}
        </Link>
      ) : (
        <span aria-label={label}>{content}</span>
      )}
    </Tooltip>
  );
}

export function StatHud({ className }: { className?: string }) {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const streak = useProgressStore((s) => s.streak);
  const gems = useProgressStore((s) => s.gems);
  const xp = useProgressStore((s) => s.xp);
  const level = useLevel();
  const hearts = useHearts();

  // Before hydration the store holds defaults that would flash wrong numbers.
  if (!hasHydrated) {
    return (
      <div className={cn("flex items-center gap-1", className)} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-14 rounded-xl bg-bg-inset shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-0.5 sm:gap-1", className)}>
      <StatPill
        icon={
          streak > 0 ? (
            <LottiePlayer
              name="streak-flame"
              className="size-5"
              fallback={<Flame className="size-4.5 text-streak" />}
            />
          ) : (
            <Flame className="size-4.5 text-fg-subtle" />
          )
        }
        value={streak}
        label={streak > 0 ? `${streak}-day streak` : "Start a streak today"}
        tone={streak > 0 ? "text-streak" : "text-fg-subtle"}
        href="/dashboard"
      />

      <StatPill
        icon={<Zap className="size-4.5 fill-current" />}
        value={formatCompact(xp)}
        label={`Level ${level.level} · ${formatCompact(xp)} XP total`}
        tone="text-xp-dark dark:text-xp"
        href="/dashboard"
      />

      <StatPill
        icon={<Gem className="size-4.5" />}
        value={formatCompact(gems)}
        label={`${gems} gems`}
        tone="text-gem"
        href="/shop"
      />

      <StatPill
        icon={
          <Heart
            className={cn("size-4.5", hearts.hearts > 0 && "fill-current")}
          />
        }
        value={hearts.hearts}
        label={
          hearts.isFull
            ? "Hearts full"
            : `${hearts.hearts}/${MAX_HEARTS} hearts · next in ${formatHeartTimer(hearts.msToNextHeart)}`
        }
        tone={hearts.hearts > 0 ? "text-heart" : "text-fg-subtle"}
        href="/shop"
      />
    </div>
  );
}

/** Compact level bar used in the sidebar and profile header. */
export function LevelBar({ className }: { className?: string }) {
  const level = useLevel();
  const hasHydrated = useProgressStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return <div className={cn("h-9 rounded-xl bg-bg-inset shimmer", className)} />;
  }

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 eyebrow">
          <span className="text-base leading-none">{level.rank.glyph}</span>
          <span>
            Level {level.level}
            <span className="ml-1.5 font-bold text-fg-subtle normal-case">
              {level.rank.title}
            </span>
          </span>
        </span>
        <span className="text-xs font-bold tabular-nums text-fg-subtle">
          {level.isMaxLevel
            ? "MAX"
            : `${Math.round(level.xpIntoLevel)} / ${level.xpForNextLevel}`}
        </span>
      </div>
      <Progress value={level.percent} tone="xp" size="sm" label="Level progress" />
    </div>
  );
}
