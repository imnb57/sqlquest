"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * User preferences.
 *
 * Kept separate from progress so that clearing progress never wipes someone's
 * accessibility settings, and so the settings screen can save instantly
 * without touching the (much larger) progress blob.
 */

export type EditorKeymap = "default" | "vim";
export type ResultDensity = "comfortable" | "compact";

export interface SettingsState {
  hasHydrated: boolean;

  /* Learning */
  dailyGoalXp: number;
  /** Hard mode removes the starter scaffolding and the expected-output panel. */
  hardMode: boolean;
  showExpectedOnFail: boolean;
  autoAdvance: boolean;
  heartsEnabled: boolean;

  /* Editor */
  editorFontSize: number;
  editorKeymap: EditorKeymap;
  autocompleteEnabled: boolean;
  lineNumbers: boolean;
  autoFormatOnRun: boolean;
  resultDensity: ResultDensity;

  /* Experience */
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  confettiEnabled: boolean;

  /* Privacy */
  publicProfile: boolean;
  showOnLeaderboard: boolean;
  shareAnonymousStats: boolean;

  /* Notifications */
  emailStreakReminders: boolean;
  emailWeeklyDigest: boolean;
  emailProductUpdates: boolean;
}

interface SettingsActions {
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  patch: (values: Partial<SettingsState>) => void;
  reset: () => void;
  setHydrated: () => void;
}

const defaults: SettingsState = {
  hasHydrated: false,

  dailyGoalXp: 50,
  hardMode: false,
  showExpectedOnFail: true,
  autoAdvance: true,
  heartsEnabled: true,

  editorFontSize: 14,
  editorKeymap: "default",
  autocompleteEnabled: true,
  lineNumbers: true,
  autoFormatOnRun: false,
  resultDensity: "comfortable",

  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  confettiEnabled: true,

  publicProfile: true,
  showOnLeaderboard: true,
  shareAnonymousStats: true,

  emailStreakReminders: true,
  emailWeeklyDigest: true,
  emailProductUpdates: false,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaults,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      patch: (values) => set(values),
      reset: () => set({ ...defaults, hasHydrated: true }),
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "sqlquest:settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ hasHydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Mirrors the motion preference onto <html> so CSS can act on it globally. */
export function applyMotionPreference(reduced: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.motion = reduced ? "reduced" : "full";
}
