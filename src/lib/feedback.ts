"use client";

import { useSettingsStore } from "@/stores/settings-store";

/**
 * Non-visual feedback: sound, haptics and confetti.
 *
 * Sounds are synthesised with the Web Audio API rather than shipped as files —
 * a handful of short tones costs zero bytes of download, never 404s, and can
 * be tuned in code. Everything here no-ops gracefully when unsupported or
 * when the learner has turned it off.
 */

type ToneSpec = {
  /** [frequency, startOffsetSeconds, durationSeconds] triples. */
  notes: [number, number, number][];
  type?: OscillatorType;
  gain?: number;
};

const TONES = {
  correct: {
    notes: [
      [660, 0, 0.11],
      [880, 0.09, 0.16],
    ],
    type: "sine",
    gain: 0.16,
  },
  wrong: {
    notes: [
      [220, 0, 0.14],
      [165, 0.1, 0.2],
    ],
    type: "sine",
    gain: 0.14,
  },
  levelUp: {
    notes: [
      [523.25, 0, 0.12],
      [659.25, 0.1, 0.12],
      [783.99, 0.2, 0.12],
      [1046.5, 0.3, 0.3],
    ],
    type: "triangle",
    gain: 0.14,
  },
  complete: {
    notes: [
      [587.33, 0, 0.12],
      [739.99, 0.11, 0.12],
      [880, 0.22, 0.26],
    ],
    type: "triangle",
    gain: 0.15,
  },
  tick: { notes: [[1200, 0, 0.035]], type: "square", gain: 0.05 },
  unlock: {
    notes: [
      [880, 0, 0.09],
      [1108.73, 0.08, 0.09],
      [1318.51, 0.16, 0.22],
    ],
    type: "sine",
    gain: 0.13,
  },
} satisfies Record<string, ToneSpec>;

export type SoundName = keyof typeof TONES;

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioContext ??= new Ctor();
    // Browsers suspend the context until a user gesture; resuming is cheap
    // and a no-op when it's already running.
    if (audioContext.state === "suspended") void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

export function playSound(name: SoundName) {
  if (!useSettingsStore.getState().soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const spec = TONES[name] as ToneSpec;
  const now = ctx.currentTime;

  for (const [freq, offset, duration] of spec.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type ?? "sine";
    osc.frequency.setValueAtTime(freq, now + offset);

    const peak = spec.gain ?? 0.15;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(peak, now + offset + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + duration + 0.02);
  }
}

/* --------------------------------------------------------------- haptics */

const PATTERNS = {
  light: 10,
  success: [12, 40, 18],
  error: [28, 60, 28],
  heavy: 32,
} as const;

export function vibrate(pattern: keyof typeof PATTERNS = "light") {
  if (!useSettingsStore.getState().hapticsEnabled) return;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern] as number | number[]);
  } catch {
    /* Safari and some desktop browsers simply don't have it. */
  }
}

/* -------------------------------------------------------------- confetti */

export type ConfettiIntensity = "small" | "medium" | "large";

/**
 * Confetti is loaded on demand — it's only ever needed after a success, so
 * there's no reason for it to be in the initial bundle.
 */
export async function fireConfetti(intensity: ConfettiIntensity = "medium") {
  const { confettiEnabled, reducedMotion } = useSettingsStore.getState();
  if (!confettiEnabled || reducedMotion) return;
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { default: confetti } = await import("canvas-confetti");

  const colors = ["#7c3aed", "#22d3ee", "#a3e635", "#fbbf24", "#f43f5e"];

  if (intensity === "small") {
    void confetti({
      particleCount: 45,
      spread: 55,
      startVelocity: 32,
      origin: { y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    return;
  }

  if (intensity === "medium") {
    void confetti({
      particleCount: 110,
      spread: 78,
      startVelocity: 42,
      origin: { y: 0.65 },
      colors,
      disableForReducedMotion: true,
    });
    return;
  }

  // Large: two angled cannons plus a centre burst, staggered.
  const shoot = (particleCount: number, angle: number, x: number) =>
    confetti({
      particleCount,
      angle,
      spread: 62,
      startVelocity: 52,
      origin: { x, y: 0.68 },
      colors,
      disableForReducedMotion: true,
    });

  void shoot(80, 60, 0.08);
  void shoot(80, 120, 0.92);
  setTimeout(() => void shoot(60, 90, 0.5), 180);
  setTimeout(() => void shoot(50, 75, 0.25), 340);
  setTimeout(() => void shoot(50, 105, 0.75), 340);
}

/** Convenience bundle for the "you got it right" moment. */
export function celebrateCorrect(streak: number) {
  playSound("correct");
  vibrate("success");
  if (streak > 0 && streak % 5 === 0) void fireConfetti("small");
}

export function celebrateWrong() {
  playSound("wrong");
  vibrate("error");
}
