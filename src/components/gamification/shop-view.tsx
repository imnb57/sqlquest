"use client";

import * as React from "react";
import { Gem, Heart, Info, Snowflake, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHearts, useProgressStore } from "@/stores/progress-store";
import {
  MAX_HEARTS,
  HEART_REFILL_GEM_COST,
  formatHeartTimer,
} from "@/lib/gamification/hearts";
import { playSound } from "@/lib/feedback";

/**
 * Gem shop.
 *
 * Every currency here is earned by learning — there is no purchase path and
 * no real money. Gems exist to make choices meaningful (spend on a refill now
 * or save for a freeze?), not to create a paywall.
 */
export function ShopView() {
  const gems = useProgressStore((s) => s.gems);
  const spendGems = useProgressStore((s) => s.spendGems);
  const refillHearts = useProgressStore((s) => s.refillHearts);
  const streakFreezes = useProgressStore((s) => s.streakFreezes);
  const hasHydrated = useProgressStore((s) => s.hasHydrated);
  const hearts = useHearts();

  const buyFreeze = () => {
    if (streakFreezes >= 2) {
      toast.info("You can hold at most 2 streak freezes.");
      return;
    }
    if (!spendGems(80)) {
      toast.error("Not enough gems", { description: "Streak freezes cost 80 💎." });
      return;
    }
    useProgressStore.setState((s) => ({ streakFreezes: s.streakFreezes + 1 }));
    playSound("unlock");
    toast.success("Streak freeze added", {
      description: "It'll be used automatically if you miss a day.",
    });
  };

  const doRefill = () => {
    if (hearts.isFull) {
      toast.info("Your hearts are already full.");
      return;
    }
    if (refillHearts()) {
      playSound("unlock");
      toast.success("Hearts refilled");
    } else {
      toast.error("Not enough gems", {
        description: `A refill costs ${HEART_REFILL_GEM_COST} 💎.`,
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold sm:text-3xl">
            <Sparkles className="size-7 text-gem" />
            Shop
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Gems come from achievements, daily quests and perfect lessons.
          </p>
        </div>

        <Badge variant="aqua" size="lg" className="tabular-nums">
          <Gem />
          {hasHydrated ? gems : "—"} gems
        </Badge>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-aqua-500/35 bg-aqua-500/8 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-aqua-600 dark:text-aqua-300" />
        <p className="text-sm leading-relaxed text-fg-muted">
          <strong className="font-extrabold text-fg">Nothing here costs money.</strong>{" "}
          SQLQuest is free and open source — gems are purely an in-app currency
          you earn by learning. There is no paid tier, no ads and no upsell.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <Heart className="size-8 fill-current text-heart" />
            <Badge variant="neutral" size="sm" className="tabular-nums">
              {hasHydrated ? `${hearts.hearts}/${MAX_HEARTS}` : "—"}
            </Badge>
          </div>
          <h2 className="mt-3 text-lg font-extrabold">Refill hearts</h2>
          <p className="mt-1 flex-1 text-sm text-fg-muted">
            Top straight back up to {MAX_HEARTS}. They also refill on their own —
            one every 20 minutes
            {hasHydrated && !hearts.isFull
              ? `, next in ${formatHeartTimer(hearts.msToNextHeart)}`
              : ""}
            .
          </p>
          <Button
            className="mt-4"
            variant="accent"
            full
            onClick={doRefill}
            disabled={!hasHydrated || hearts.isFull || gems < HEART_REFILL_GEM_COST}
          >
            <Gem />
            {hearts.isFull ? "Hearts full" : `Refill for ${HEART_REFILL_GEM_COST}`}
          </Button>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <Snowflake className="size-8 text-aqua-500" />
            <Badge variant="neutral" size="sm" className="tabular-nums">
              {hasHydrated ? `${streakFreezes}/2` : "—"}
            </Badge>
          </div>
          <h2 className="mt-3 text-lg font-extrabold">Streak freeze</h2>
          <p className="mt-1 flex-1 text-sm text-fg-muted">
            Protects your streak for one missed day. Used automatically — you
            can hold up to two at a time.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            full
            onClick={buyFreeze}
            disabled={!hasHydrated || streakFreezes >= 2 || gems < 80}
          >
            <Gem />
            {streakFreezes >= 2 ? "At capacity" : "Buy for 80"}
          </Button>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="section-label">
          How to earn gems
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-fg-muted">
          {[
            ["Complete a daily quest", "10–15 💎"],
            ["Finish a lesson with 100% accuracy", "5 💎"],
            ["Unlock a bronze achievement", "10 💎"],
            ["Unlock a silver achievement", "25 💎"],
            ["Unlock a gold achievement", "60 💎"],
            ["Unlock a legendary achievement", "150 💎"],
          ].map(([what, reward]) => (
            <li
              key={what}
              className={cn(
                "flex items-center justify-between gap-3 border-b border-border-base pb-2 last:border-b-0 last:pb-0",
              )}
            >
              <span>{what}</span>
              <span className="shrink-0 font-extrabold text-fg tabular-nums">
                {reward}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
