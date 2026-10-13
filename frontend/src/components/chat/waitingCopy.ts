/**
 * Pure elapsed-time waiting copy (WAIT-03, WAIT-04).
 *
 * Band and variant selection is pure elapsed-time math — no render-count
 * path, no randomness, no completion or percentage claims. Mirrors the
 * domain-layer pattern: no React, no DOM.
 */

export type BandId = "A" | "B" | "C" | "D" | "E" | "F";

/** Verbatim UI-SPEC time-banded copy table — six bands, two variants each. */
export const BAND_COPY: Record<BandId, [string, string]> = {
  A: ["Reading your request.", "Working on your plan."],
  B: ["Gathering destination ideas.", "Looking at places that fit your trip."],
  C: ["Checking routes and places to stay.", "Weighing options for your itinerary."],
  D: [
    "This one is taking a while. Full itineraries often do.",
    "Still going. Longer trips need more research.",
  ],
  E: ["Still working on your plan.", "Detailed plans take time to put together."],
  F: [
    "This is taking longer than usual. Keep waiting, or stop and try again.",
    "Longer than a typical plan. Keep waiting, or stop and start again.",
  ],
};

/**
 * Band selection is a pure function of elapsed time:
 * <60_000 A, <180_000 B, <300_000 C, <540_000 D, <900_000 E, else F.
 */
export function selectBand(elapsedMs: number): BandId {
  if (elapsedMs < 60_000) return "A";
  if (elapsedMs < 180_000) return "B";
  if (elapsedMs < 300_000) return "C";
  if (elapsedMs < 540_000) return "D";
  if (elapsedMs < 900_000) return "E";
  return "F";
}

/**
 * Variant selection: floor(elapsed / 45000) % 2.
 * Never render-count-driven, never repeats consecutively.
 */
export function selectVariant(elapsedMs: number): 0 | 1 {
  return (Math.floor(elapsedMs / 45_000) % 2) as 0 | 1;
}

/**
 * Format elapsed ms as M:SS — minutes unpadded, seconds zero-padded.
 */
export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
