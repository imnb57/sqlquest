"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { usePrefersReducedMotion } from "@/hooks/use-client";

/**
 * Lottie wrapper.
 *
 * `lottie-react` is ~50 KB gzipped and pulls in a renderer, so it's loaded on
 * demand and never during SSR. Animation JSON is imported the same way, which
 * keeps each animation in its own chunk — a page that only shows the mascot
 * never downloads the confetti burst.
 */

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => null,
});

export type AnimationName =
  | "streak-flame"
  | "correct-check"
  | "wrong-cross"
  | "level-up"
  | "celebrate"
  | "booting-engine"
  | "mascot-idle"
  | "empty-search";

const LOADERS: Record<AnimationName, () => Promise<{ default: object }>> = {
  "streak-flame": () => import("@/animations/streak-flame.json"),
  "correct-check": () => import("@/animations/correct-check.json"),
  "wrong-cross": () => import("@/animations/wrong-cross.json"),
  "level-up": () => import("@/animations/level-up.json"),
  celebrate: () => import("@/animations/celebrate.json"),
  "booting-engine": () => import("@/animations/booting-engine.json"),
  "mascot-idle": () => import("@/animations/mascot-idle.json"),
  "empty-search": () => import("@/animations/empty-search.json"),
};

/**
 * Module-level cache of loaded animation data. Because it lives outside React,
 * a second component mounting the same animation renders it immediately
 * instead of flashing the fallback while a resolved import re-resolves.
 */
const cache = new Map<AnimationName, object>();

export interface LottiePlayerProps {
  name: AnimationName;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  /** Called once the animation finishes (non-looping only). */
  onComplete?: () => void;
  /** Rendered while the chunk loads, and instead of the animation when the
   *  viewer has asked for reduced motion. */
  fallback?: React.ReactNode;
  "aria-hidden"?: boolean;
}

export function LottiePlayer({
  name,
  loop = true,
  autoplay = true,
  className,
  onComplete,
  fallback = null,
  "aria-hidden": ariaHidden = true,
}: LottiePlayerProps) {
  const reducedSetting = useSettingsStore((s) => s.reducedMotion);
  const prefersReduced = usePrefersReducedMotion() || reducedSetting;

  // The cache is the source of truth; this only forces a re-read once a
  // pending import resolves, so nothing is stored in state twice.
  const [, revision] = React.useReducer((n: number) => n + 1, 0);
  const data = cache.get(name) ?? null;

  React.useEffect(() => {
    if (prefersReduced || cache.has(name)) return;

    let cancelled = false;
    void LOADERS[name]().then((mod) => {
      cache.set(name, mod.default);
      if (!cancelled) revision();
    });

    return () => {
      cancelled = true;
    };
  }, [name, prefersReduced]);

  // With reduced motion we skip the animation entirely but still fire the
  // completion callback, so lesson flow that waits on it never stalls.
  React.useEffect(() => {
    if (!prefersReduced || !onComplete) return;
    const id = setTimeout(onComplete, 220);
    return () => clearTimeout(id);
  }, [prefersReduced, onComplete]);

  if (prefersReduced || !data) {
    return <div className={cn("grid place-items-center", className)}>{fallback}</div>;
  }

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      onComplete={onComplete}
      className={className}
      aria-hidden={ariaHidden}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet", progressiveLoad: true }}
    />
  );
}

export { usePrefersReducedMotion };
