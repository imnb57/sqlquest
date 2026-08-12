"use client";

import * as React from "react";

/**
 * Client-only environment hooks.
 *
 * Both use `useSyncExternalStore` rather than the older
 * `useState(false)` + `useEffect(() => setMounted(true))` dance. That pattern
 * causes a cascading render on every mount and is exactly what React 19's
 * `set-state-in-effect` rule warns about; `useSyncExternalStore` gives the
 * server and client different snapshots with no extra render at all.
 */

const noopSubscribe = () => () => {};

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 * Use it to defer rendering anything that can't be known on the server.
 */
export function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/* --------------------------------------------------------- media queries */

const mediaStores = new Map<
  string,
  { subscribe: (cb: () => void) => () => void; getSnapshot: () => boolean }
>();

function getMediaStore(query: string) {
  let store = mediaStores.get(query);
  if (!store) {
    store = {
      subscribe(callback: () => void) {
        const mq = window.matchMedia(query);
        mq.addEventListener("change", callback);
        return () => mq.removeEventListener("change", callback);
      },
      getSnapshot: () => window.matchMedia(query).matches,
    };
    mediaStores.set(query, store);
  }
  return store;
}

/** Reactive media query. Returns `false` on the server. */
export function useMediaQuery(query: string): boolean {
  const store = React.useMemo(() => getMediaStore(query), [query]);
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => false,
  );
}

/** Tracks the OS-level reduced-motion preference. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
