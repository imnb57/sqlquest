"use client";

import { Flame, Gem, Heart, Zap } from "lucide-react";
import { LottiePlayer } from "@/components/animation/lottie";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * Illustrative panel for the "how it works" section: the mascot plus a mock
 * of the in-lesson HUD, so visitors can see the game layer before signing up.
 */
export function MascotHero() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute inset-8 rounded-full bg-gradient-to-br from-brand-400/25 to-aqua-400/20 blur-3xl"
      />

      <div className="relative rounded-3xl border border-border-base bg-bg-elevated p-6 shadow-xl shadow-brand-950/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="streak" size="lg">
              <Flame />7
            </Badge>
            <Badge variant="xp" size="lg">
              <Zap />
              1,240
            </Badge>
            <Badge variant="aqua" size="lg">
              <Gem />
              85
            </Badge>
          </div>
          <span className="flex items-center gap-1 font-extrabold text-heart">
            <Heart className="size-5 fill-current" />5
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between eyebrow text-fg-subtle">
            <span>Lesson progress</span>
            <span className="tabular-nums">4 / 6</span>
          </div>
          <Progress value={66} tone="success" striped size="md" label="Demo progress" />
        </div>

        <div className="mx-auto mt-4 size-52 animate-float">
          <LottiePlayer
            name="mascot-idle"
            className="size-full"
            fallback={<span className="grid size-full place-items-center text-7xl">🐘</span>}
          />
        </div>

        <div className="rounded-2xl border-2 border-success/40 bg-success/8 p-4 text-center">
          <p className="font-extrabold text-success">Correct!</p>
          <p className="mt-0.5 text-sm text-fg-muted">
            +15 XP · 3-answer combo bonus
          </p>
        </div>
      </div>
    </div>
  );
}
