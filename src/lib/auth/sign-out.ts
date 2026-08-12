"use client";

import { signOut } from "next-auth/react";
import { useProgressStore } from "@/stores/progress-store";

/**
 * Signs the learner out.
 *
 * Deliberately does NOT let Auth.js perform the redirect. Given `redirectTo` /
 * `callbackUrl`, Auth.js builds an absolute URL from the server's own origin,
 * and in a container that origin is the bind address — so signing out landed
 * people on `http://0.0.0.0:3000/`, which the browser can't load. Navigating
 * ourselves keeps the user on whatever host they actually arrived on.
 *
 * The full page navigation (rather than a router push) is intentional: it
 * guarantees no stale session state survives in memory.
 */
export async function signOutAndClear({
  keepLocalProgress = false,
  redirectTo = "/",
}: { keepLocalProgress?: boolean; redirectTo?: string } = {}) {
  await signOut({ redirect: false });

  if (!keepLocalProgress) {
    /*
     * Wipe the browser's copy of progress.
     *
     * The server holds a synced backup, so nothing is lost — and leaving one
     * person's XP, streak and lesson history in localStorage for the next
     * person to use this browser would be a real privacy leak on a shared or
     * public machine. Preferences (theme, motion, sound) are deliberately
     * kept: those describe the device, not the person.
     */
    useProgressStore.getState().resetProgress();
    try {
      window.localStorage.removeItem("sqlquest:playground");
    } catch {
      /* Storage can be unavailable in private mode; nothing to clean up. */
    }
  }

  window.location.href = redirectTo;
}
