import { describe, expect, it } from "vitest";
import {
  CHUNK_SIZE,
  COOKIE_PREFIX,
  INDEX_COOKIE,
  chunkString,
  decodeEnvelope,
  decodeEnvelopeSafe,
  encodeEnvelope,
  joinChunks,
  parseEnvelopeIndex,
} from "./codec";
import type { Conversation } from "./schema";

/**
 * The codec is the ~4 KB-per-cookie workaround (D-18) and the first half of
 * the recovery contract (D-22). Chunk boundaries fall on conversation edges so
 * a single corrupt chunk costs one conversation instead of the whole snapshot.
 */

const AT = "2026-01-01T00:00:00Z";

function conversation(
  id: string,
  contentLength: number,
  updatedAt = "2026-01-02T00:00:00Z",
): Conversation {
  return {
    id,
    title: `Conversation ${id}`,
    createdAt: AT,
    updatedAt,
    messages: [
      {
        id: `${id}-m1`,
        role: "user",
        content: "x".repeat(contentLength),
        createdAt: AT,
      },
    ],
  };
}

describe("chunkString", () => {
  it("splits into fixed-size chunks", () => {
    expect(chunkString("abcdef", 2)).toEqual(["ab", "cd", "ef"]);
  });

  it("returns a single empty chunk for an empty string", () => {
    expect(chunkString("", 2)).toEqual([""]);
  });

  it("returns one chunk when the string is exactly the size", () => {
    expect(chunkString("abcdef", 6)).toEqual(["abcdef"]);
  });

  it("returns two chunks when the string is one byte over the size", () => {
    expect(chunkString("abcdef", 5)).toEqual(["abcde", "f"]);
  });
});

describe("joinChunks", () => {
  it("joins chunks back into the original string", () => {
    expect(joinChunks(["ab", "cd", "ef"])).toBe("abcdef");
  });

  it("round-trips anything chunkString produced", () => {
    const original = "Waynora travel planning cookie payload".repeat(37);
    expect(joinChunks(chunkString(original, CHUNK_SIZE))).toBe(original);
  });
});

describe("cookie constants", () => {
  it("uses a 3.5 KB chunk target", () => {
    expect(CHUNK_SIZE).toBe(3500);
  });

  it("uses the waynora cookie namespace", () => {
    expect(COOKIE_PREFIX).toBe("waynora_chat_");
    expect(INDEX_COOKIE).toBe("waynora_chat_index");
  });
});

describe("encodeEnvelope", () => {
  it("returns an index describing the written cookies", () => {
    const { index, chunks } = encodeEnvelope({
      version: 1,
      conversations: [conversation("c-1", 100)],
    });

    const parsed = parseEnvelopeIndex(index);
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(1);
    expect(parsed?.count).toBe(chunks.length);
    expect(parsed?.segments.map((s) => s.id)).toEqual(["c-1"]);
  });

  it("keeps every chunk at or below the chunk size", () => {
    const { chunks } = encodeEnvelope({
      version: 1,
      conversations: [
        conversation("c-1", 9000),
        conversation("c-2", 7000, "2026-01-03T00:00:00Z"),
      ],
    });

    expect(chunks.length).toBeGreaterThan(2);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }
  });

  it("shards each conversation into its own cookie range", () => {
    const { index, chunks } = encodeEnvelope({
      version: 1,
      conversations: [
        conversation("c-1", 4000),
        conversation("c-2", 4000),
        conversation("c-3", 4000),
      ],
    });

    const parsed = parseEnvelopeIndex(index);
    expect(parsed?.segments.map((s) => s.count)).toEqual([2, 2, 2]);
    expect(chunks).toHaveLength(6);
  });
});

describe("decodeEnvelope", () => {
  it("round-trips an envelope without losing data", () => {
    const envelope = {
      version: 1 as const,
      conversations: [
        conversation("c-1", 5000),
        conversation("c-2", 1200, "2026-01-05T00:00:00Z"),
      ],
    };

    const { index, chunks } = encodeEnvelope(envelope);

    expect(decodeEnvelope(index, chunks)).toEqual(envelope);
  });

  it("round-trips an envelope with metadata and threadId", () => {
    const envelope = {
      version: 1 as const,
      conversations: [
        {
          ...conversation("c-1", 200),
          threadId: "thread-9",
          messages: [
            {
              id: "c-1-m1",
              role: "user" as const,
              content: "Plan a trip",
              createdAt: AT,
            },
            {
              id: "c-1-m2",
              role: "assistant" as const,
              content: "Here is your plan",
              createdAt: AT,
              metadata: { inFlight: true, error: "Request failed" },
            },
          ],
        },
      ],
    };

    const { index, chunks } = encodeEnvelope(envelope);

    expect(decodeEnvelope(index, chunks)).toEqual(envelope);
  });

  it("round-trips an empty envelope", () => {
    const { index, chunks } = encodeEnvelope({ version: 1, conversations: [] });

    expect(decodeEnvelope(index, chunks)).toEqual({ version: 1, conversations: [] });
  });

  it("throws when a chunk has been tampered with", () => {
    const { index, chunks } = encodeEnvelope({
      version: 1,
      conversations: [conversation("c-1", 100)],
    });

    chunks[0] = "not-valid-json";

    expect(() => decodeEnvelope(index, chunks)).toThrow();
  });
});

describe("decodeEnvelopeSafe", () => {
  it("reports an empty state when no index exists", () => {
    const result = decodeEnvelopeSafe("", ["[]"]);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("index-malformed");
    expect(result.envelope).toBeNull();
  });

  it("rejects an unsupported envelope version rather than migrating (D-16)", () => {
    const { index, chunks } = encodeEnvelope({
      version: 1,
      conversations: [conversation("c-1", 100)],
    });

    const tampered = JSON.parse(index) as Record<string, unknown>;
    tampered.version = 2;
    const result = decodeEnvelopeSafe(JSON.stringify(tampered), chunks);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("version-unsupported");
    expect(result.envelope).toBeNull();
  });

  it("drops a conversation whose chunk was lost and keeps the rest (D-22)", () => {
    const { index, chunks } = encodeEnvelope({
      version: 1,
      conversations: [
        conversation("c-1", 4000),
        conversation("c-2", 4000, "2026-01-03T00:00:00Z"),
        conversation("c-3", 4000, "2026-01-04T00:00:00Z"),
      ],
    });

    const withHoles: Array<string | null> = [...chunks];
    withHoles[2] = null;

    const result = decodeEnvelopeSafe(index, withHoles);

    expect(result.ok).toBe(true);
    expect(result.recovered).toBe(true);
    expect(result.dropped).toEqual(["c-2"]);
    expect(result.envelope?.conversations.map((c) => c.id)).toEqual(["c-1", "c-3"]);
  });

  it("reports no recovery when every chunk is present", () => {
    const envelope = {
      version: 1 as const,
      conversations: [conversation("c-1", 4000), conversation("c-2", 4000, "2026-01-03T00:00:00Z")],
    };
    const { index, chunks } = encodeEnvelope(envelope);

    const result = decodeEnvelopeSafe(index, chunks);

    expect(result).toEqual({
      ok: true,
      envelope,
      dropped: [],
      recovered: false,
    });
  });

  it("drops a conversation whose chunk content is corrupt", () => {
    const { index, chunks } = encodeEnvelope({
      version: 1,
      conversations: [
        conversation("c-1", 4000),
        conversation("c-2", 4000, "2026-01-03T00:00:00Z"),
      ],
    });

    const tampered = [...chunks];
    tampered[0] = "%E0%A4%A"; // malformed percent-escape

    const result = decodeEnvelopeSafe(index, tampered);

    expect(result.ok).toBe(true);
    expect(result.recovered).toBe(true);
    expect(result.dropped).toEqual(["c-1"]);
    expect(result.envelope?.conversations.map((c) => c.id)).toEqual(["c-2"]);
  });

  it("returns nothing when all chunks are missing", () => {
    const { index, chunks } = encodeEnvelope({
      version: 1,
      conversations: [conversation("c-1", 100)],
    });

    const result = decodeEnvelopeSafe(index, chunks.map(() => null));

    expect(result.ok).toBe(true);
    expect(result.recovered).toBe(true);
    expect(result.dropped).toEqual(["c-1"]);
    expect(result.envelope).toEqual({ version: 1, conversations: [] });
  });
});

describe("parseEnvelopeIndex", () => {
  it("returns null for non-JSON garbage", () => {
    expect(parseEnvelopeIndex("~~~bad~~~")).toBeNull();
  });

  it("returns null for a JSON payload missing the segment map", () => {
    expect(parseEnvelopeIndex(JSON.stringify({ version: 1, count: 1 }))).toBeNull();
  });

  it("returns null for an unknown extra index key", () => {
    expect(
      parseEnvelopeIndex(
        JSON.stringify({
          version: 1,
          count: 1,
          totalSize: 10,
          segments: [{ id: "c-1", count: 1 }],
          secret: "abc",
        }),
      ),
    ).toBeNull();
  });
});
