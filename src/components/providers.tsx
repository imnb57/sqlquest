"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/overlays";
import { Toaster } from "sonner";
import { useSettingsStore, applyMotionPreference } from "@/stores/settings-store";
import { useProgressStore, serialisableProgress } from "@/stores/progress-store";

/**
 * Client-side providers.
 *
 * Deliberately thin: theme, data cache, tooltips and toasts. Progress and
 * settings are Zustand stores, which need no provider at all — that keeps the
 * server-rendered tree free of context boundaries that would force whole
 * pages to become client components.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="sqlquest:theme"
    >
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          // The session is only needed for sync/leaderboard, so don't poll
          // and don't refetch on focus — guests must never see a spinner.
          refetchOnWindowFocus={false}
          refetchInterval={0}
        >
          <TooltipProvider delayDuration={220} skipDelayDuration={400}>
            <MotionPreferenceSync />
            <ProgressSync />
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast:
                    "!rounded-xl !border-border-base !bg-bg-elevated !text-fg !font-semibold",
                },
              }}
            />
          </TooltipProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

/** Mirrors the in-app motion preference onto <html data-motion>. */
function MotionPreferenceSync() {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const hasHydrated = useSettingsStore((s) => s.hasHydrated);

  React.useEffect(() => {
    if (hasHydrated) applyMotionPreference(reducedMotion);
  }, [reducedMotion, hasHydrated]);

  return null;
}

/**
 * Backs local progress up to the server for signed-in learners.
 *
 * Debounced and fire-and-forget: a failed sync is never surfaced as an error
 * because the browser copy remains authoritative. On first sign-in the server
 * snapshot is merged in, so progress made as a guest is preserved.
 */
function ProgressSync() {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && Boolean(session?.user);
  const pulled = React.useRef(false);

  React.useEffect(() => {
    if (!signedIn || pulled.current) return;
    pulled.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as { progress?: Record<string, unknown> };
        if (body.progress) {
          useProgressStore.getState().hydrateFromServer(body.progress);
        }
      } catch {
        /* Offline or DB-less deployment: local progress stands. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  React.useEffect(() => {
    if (!signedIn) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const push = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const snapshot = serialisableProgress(useProgressStore.getState());
          const res = await fetch("/api/progress", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(snapshot),
            keepalive: true,
          });
          if (res.ok) useProgressStore.getState().markSynced();
        } catch {
          /* Retried on the next store change. */
        }
      }, 4000);
    };

    const unsubscribe = useProgressStore.subscribe(push);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [signedIn]);

  return null;
}
