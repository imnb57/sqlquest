"use client";

import * as React from "react";
import { Lock, Medal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  TIER_STYLES,
  type AchievementCategory,
} from "@/lib/gamification/achievements";
import { useAchievementSnapshot, useProgressStore } from "@/stores/progress-store";

const CATEGORIES: { id: AchievementCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "progress", label: "Progress" },
  { id: "streak", label: "Streaks" },
  { id: "mastery", label: "Mastery" },
  { id: "exploration", label: "Exploration" },
  { id: "secret", label: "Secret" },
];

export function AchievementsView() {
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const snapshot = useAchievementSnapshot();
  const states = React.useMemo(() => evaluateAchievements(snapshot), [snapshot]);

  const unlockedCount = states.filter((s) => s.unlocked).length;
  const gemsEarned = states
    .filter((s) => s.unlocked)
    .reduce((sum, s) => sum + s.achievement.gemReward, 0);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold sm:text-3xl">
            <Medal className="size-7 text-xp-dark dark:text-xp" />
            Achievements
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {hasHydrated
              ? `${unlockedCount} of ${ACHIEVEMENTS.length} unlocked · ${gemsEarned} gems earned`
              : `${ACHIEVEMENTS.length} to collect`}
          </p>
        </div>

        <div className="w-full max-w-xs">
          <Progress
            value={unlockedCount}
            max={ACHIEVEMENTS.length}
            tone="xp"
            size="md"
            label="Achievements unlocked"
          />
        </div>
      </header>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => {
          const visible = states.filter(
            (s) => category.id === "all" || s.achievement.category === category.id,
          );

          return (
            <TabsContent key={category.id} value={category.id} className="mt-5">
              <ul className="grid gap-3 sm:grid-cols-2">
                {visible.map(({ achievement, progress, unlocked, percent }) => {
                  const hidden = achievement.secret && !unlocked;
                  const tier = TIER_STYLES[achievement.tier];

                  return (
                    <li key={achievement.id}>
                      <Card
                        className={cn(
                          "h-full p-4 transition-opacity",
                          unlocked ? cn("ring-2", tier.ring, tier.bg) : "opacity-95",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "grid size-12 shrink-0 place-items-center rounded-xl text-2xl",
                              unlocked ? tier.bg : "bg-bg-inset grayscale",
                            )}
                            aria-hidden="true"
                          >
                            {hidden ? <Lock className="size-5 text-fg-subtle" /> : achievement.glyph}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-extrabold">
                                {hidden ? "Secret achievement" : achievement.title}
                              </h3>
                              <Badge
                                size="sm"
                                variant="neutral"
                                className={cn(unlocked && tier.text)}
                              >
                                {tier.label}
                              </Badge>
                            </div>

                            <p className="mt-0.5 text-sm text-fg-muted">
                              {hidden
                                ? "Keep playing to reveal this one."
                                : achievement.description}
                            </p>

                            {!unlocked && !hidden && achievement.goal > 1 && (
                              <div className="mt-2.5 flex items-center gap-2">
                                <Progress
                                  value={percent}
                                  size="xs"
                                  tone="brand"
                                  className="flex-1"
                                  label={achievement.title}
                                />
                                <span className="text-xs font-bold tabular-nums text-fg-subtle">
                                  {progress}/{achievement.goal}
                                </span>
                              </div>
                            )}

                            {unlocked && (
                              <p className={cn("mt-2 text-xs font-extrabold", tier.text)}>
                                Unlocked · +{achievement.gemReward} 💎
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
