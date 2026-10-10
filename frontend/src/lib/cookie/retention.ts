import type { Conversation } from "./schema";

/**
 * Retention caps (D-19, D-20).
 *
 * Eviction is FIFO by `updatedAt`: the least recently updated conversation goes
 * first. Nothing is ever dropped silently — every eviction returns its
 * conversation ID so the caller can tell the user what could not be persisted.
 */

export const MAX_CONVERSATIONS = 20;
export const MAX_TOTAL_BYTES = 50_000;

export type CapResult = {
  conversations: Conversation[];
  evicted: string[];
};

/** Serialized footprint of a conversation set, in characters. */
export function calculateTotalSize(conversations: Conversation[]): number {
  return JSON.stringify(conversations).length;
}

/**
 * Applies both caps and reports what had to go.
 *
 * A single conversation larger than the whole byte budget is rejected outright
 * rather than truncated (D-19) — a partial itinerary is worse than no
 * itinerary. Survivors come back newest-first.
 */
export function enforceCap(conversations: Conversation[]): CapResult {
  const oldestFirst = [...conversations].sort((a, b) =>
    a.updatedAt.localeCompare(b.updatedAt),
  );

  const evicted: string[] = [];

  // D-19: an oversized conversation is discarded whole, never sliced.
  const keepable = oldestFirst.filter((candidate) => {
    const withinBudget = calculateTotalSize([candidate]) <= MAX_TOTAL_BYTES;
    if (!withinBudget) {
      evicted.push(candidate.id);
    }
    return withinBudget;
  });

  // Conversation-count cap, then the byte cap. Both evict from the front,
  // which is the oldest end of the sorted list.
  while (keepable.length > MAX_CONVERSATIONS) {
    evicted.push(keepable.shift()!.id);
  }
  while (
    keepable.length > 0 &&
    calculateTotalSize(keepable) > MAX_TOTAL_BYTES
  ) {
    evicted.push(keepable.shift()!.id);
  }

  const survivors = [...keepable].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return { conversations: survivors, evicted };
}
