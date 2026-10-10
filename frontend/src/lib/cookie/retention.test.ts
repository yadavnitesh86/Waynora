import { describe, expect, it } from "vitest";
import {
  MAX_CONVERSATIONS,
  MAX_TOTAL_BYTES,
  calculateTotalSize,
  enforceCap,
} from "./retention";
import type { Conversation } from "./schema";

/**
 * Retention is the D-19/D-20 contract: evict oldest first when a cap is hit,
 * and never let a conversation silently disappear. Everything here asserts the
 * returned IDs, because those IDs are what the UI shows the user.
 */

const AT = "2026-01-01T00:00:00Z";

let counter = 0;

function conversation(
  updatedAt: string,
  options: { id?: string; contentLength?: number } = {},
): Conversation {
  counter += 1;
  return {
    id: options.id ?? `c-${counter}`,
    title: `Conversation ${counter}`,
    createdAt: AT,
    updatedAt,
    messages: [
      {
        id: `c-${counter}-m1`,
        role: "user",
        content: "x".repeat(options.contentLength ?? 10),
        createdAt: AT,
      },
    ],
  };
}

function daysAgoFrom(day: number): string {
  return `2026-01-${String(day).padStart(2, "0")}T00:00:00Z`;
}

describe("retention constants", () => {
  it("caps at 20 conversations and 50 KB", () => {
    expect(MAX_CONVERSATIONS).toBe(20);
    expect(MAX_TOTAL_BYTES).toBe(50_000);
  });
});

describe("calculateTotalSize", () => {
  it("returns the JSON byte length of the conversation array", () => {
    const conversations = [conversation(daysAgoFrom(2))];

    expect(calculateTotalSize(conversations)).toBe(
      JSON.stringify(conversations).length,
    );
  });

  it("returns the empty-array length for no conversations", () => {
    expect(calculateTotalSize([])).toBe(2);
  });
});

describe("enforceCap", () => {
  it("keeps everything under both caps and orders newest first", () => {
    const input = [
      conversation(daysAgoFrom(3), { id: "old" }),
      conversation(daysAgoFrom(9), { id: "new" }),
      conversation(daysAgoFrom(5), { id: "mid" }),
    ];

    const result = enforceCap(input);

    expect(result.evicted).toEqual([]);
    expect(result.conversations.map((c) => c.id)).toEqual(["new", "mid", "old"]);
  });

  it("returns the input untouched (by reference equality) under both caps", () => {
    const input = [conversation(daysAgoFrom(4))];

    const result = enforceCap(input);

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0]).toEqual(input[0]);
  });

  it("keeps exactly MAX_CONVERSATIONS when there are more", () => {
    const input = Array.from({ length: MAX_CONVERSATIONS + 5 }, (_, i) =>
      conversation(daysAgoFrom(i + 1)),
    );

    const result = enforceCap(input);

    expect(result.conversations).toHaveLength(MAX_CONVERSATIONS);
    expect(result.evicted).toHaveLength(5);
  });

  it("evicts the oldest updatedAt conversations first (D-19)", () => {
    const input = Array.from({ length: MAX_CONVERSATIONS + 3 }, (_, i) =>
      conversation(daysAgoFrom(i + 1), { id: `c-${i}` }),
    );

    const result = enforceCap(input);

    expect(result.evicted).toEqual(["c-0", "c-1", "c-2"]);
    expect(result.conversations.map((c) => c.id)).not.toContain("c-0");
  });

  it("keeps the newest conversations when the conversation cap is hit", () => {
    const input = Array.from({ length: MAX_CONVERSATIONS + 1 }, (_, i) =>
      conversation(daysAgoFrom(i + 1), { id: `c-${i}` }),
    );

    const result = enforceCap(input);

    const survivors = result.conversations.map((c) => c.id);
    expect(survivors).toContain(`c-${MAX_CONVERSATIONS}`);
    expect(survivors).not.toContain("c-0");
  });

  it("enforces MAX_TOTAL_BYTES by evicting oldest first", () => {
    // Each conversation is ~25 KB, so four of them exceed the 50 KB cap.
    const input = Array.from({ length: 4 }, (_, i) =>
      conversation(daysAgoFrom(i + 1), { contentLength: 25_000 }),
    );
    expect(calculateTotalSize(input)).toBeGreaterThan(MAX_TOTAL_BYTES);

    const result = enforceCap(input);

    expect(calculateTotalSize(result.conversations)).toBeLessThanOrEqual(
      MAX_TOTAL_BYTES,
    );
    expect(result.evicted.length).toBeGreaterThan(0);
    expect(result.conversations.map((c) => c.updatedAt)).toEqual(
      [...result.conversations.map((c) => c.updatedAt)].sort().reverse(),
    );
  });

  it("rejects a single conversation that alone exceeds the cap (D-19)", () => {
    const oversized = conversation(daysAgoFrom(2), {
      id: "huge",
      contentLength: MAX_TOTAL_BYTES,
    });

    const result = enforceCap([oversized]);

    expect(result.conversations).toEqual([]);
    expect(result.evicted).toEqual(["huge"]);
  });

  it("keeps small conversations when one oversized conversation is rejected", () => {
    const small = conversation(daysAgoFrom(5), { id: "small" });
    const oversized = conversation(daysAgoFrom(2), {
      id: "huge",
      contentLength: MAX_TOTAL_BYTES,
    });

    const result = enforceCap([small, oversized]);

    expect(result.conversations.map((c) => c.id)).toEqual(["small"]);
    expect(result.evicted).toEqual(["huge"]);
  });

  it("returns an empty state for an empty input", () => {
    expect(enforceCap([])).toEqual({ conversations: [], evicted: [] });
  });

  it("does not mutate the input array", () => {
    const input = [
      conversation(daysAgoFrom(3), { id: "a" }),
      conversation(daysAgoFrom(9), { id: "b" }),
    ];
    const snapshot = input.map((c) => c.id);

    enforceCap(input);

    expect(input.map((c) => c.id)).toEqual(snapshot);
  });

  it("reports every evicted id exactly once", () => {
    const input = Array.from({ length: MAX_CONVERSATIONS + 4 }, (_, i) =>
      conversation(daysAgoFrom(i + 1), { id: `c-${i}` }),
    );

    const { evicted } = enforceCap(input);

    expect(new Set(evicted).size).toBe(evicted.length);
    expect(evicted).toHaveLength(4);
  });
});
