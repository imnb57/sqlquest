/**
 * Hearts (lives).
 *
 * Wrong answers cost a heart; hearts refill on a timer. The point is to make
 * carelessness cost something without ever hard-blocking a determined learner:
 * practice mode and the playground never consume hearts, and running out only
 * pauses new *lessons*.
 */

export const MAX_HEARTS = 5;
/** One heart every 20 minutes — a full refill in 100 minutes. */
export const HEART_REGEN_MS = 20 * 60 * 1000;
export const HEART_REFILL_GEM_COST = 30;

export interface HeartState {
  hearts: number;
  /** ISO timestamp of the last time hearts were recomputed. */
  updatedAt: string;
}

export interface HeartSnapshot {
  hearts: number;
  updatedAt: string;
  /** ms until the next heart arrives; 0 when full. */
  msToNextHeart: number;
  isEmpty: boolean;
  isFull: boolean;
}

/**
 * Recomputes hearts from elapsed time. Pure — call it whenever you read the
 * value rather than running a timer, so a closed tab regenerates correctly.
 */
export function regenerateHearts(
  state: HeartState,
  now: number = Date.now(),
): HeartSnapshot {
  const last = new Date(state.updatedAt).getTime();
  const safeLast = Number.isFinite(last) ? last : now;

  if (state.hearts >= MAX_HEARTS) {
    return {
      hearts: MAX_HEARTS,
      updatedAt: new Date(now).toISOString(),
      msToNextHeart: 0,
      isEmpty: false,
      isFull: true,
    };
  }

  const elapsed = Math.max(0, now - safeLast);
  const gained = Math.floor(elapsed / HEART_REGEN_MS);
  const hearts = Math.min(MAX_HEARTS, state.hearts + gained);

  // Keep the remainder so partial progress toward the next heart isn't lost.
  const consumed = gained * HEART_REGEN_MS;
  const updatedAt =
    hearts >= MAX_HEARTS
      ? new Date(now).toISOString()
      : new Date(safeLast + consumed).toISOString();

  const since = now - new Date(updatedAt).getTime();
  return {
    hearts,
    updatedAt,
    msToNextHeart: hearts >= MAX_HEARTS ? 0 : Math.max(0, HEART_REGEN_MS - since),
    isEmpty: hearts <= 0,
    isFull: hearts >= MAX_HEARTS,
  };
}

export function formatHeartTimer(ms: number): string {
  if (ms <= 0) return "Full";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    return `${h}h ${minutes % 60}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
