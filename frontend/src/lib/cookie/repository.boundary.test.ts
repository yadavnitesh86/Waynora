import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  INDEX_COOKIE,
  decodeEnvelopeSafe,
  encodeEnvelope,
  dataCookieName,
} from "./codec";
import {
  readConversations,
  writeConversations,
} from "./repository";
import { MAX_TOTAL_BYTES } from "./retention";
import type { Conversation } from "./schema";

vi.mock("../env", () => ({
  env: {
    VITE_API_BASE_URL: "http://localhost:8000",
    VITE_CONVEX_URL: "https://example.convex.cloud",
  },
  envError: [],
  isDev: false,
}));

function createCookieJar() {
  const jar = new Map<string, string>();

  return {
    get cookie(): string {
      return Array.from(jar.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
    set cookie(raw: string) {
      const parts = raw.split("; ");
      const pair = parts[0] ?? "";
      const attributes = parts.slice(1);
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);

      const maxAgeAttribute = attributes.find((attribute) =>
        attribute.toLowerCase().startsWith("max-age="),
      );
      const maxAge = maxAgeAttribute
        ? Number(maxAgeAttribute.slice("max-age=".length))
        : undefined;

      if (maxAge !== undefined && maxAge <= 0) {
        jar.delete(name);
        return;
      }
      jar.set(name, value);
    },
    rawMap: jar,
  };
}

function makeSampleConversation(id: string, overrides: Partial<Conversation> = {}): Conversation {
  return {
    id,
    title: `Trip to City ${id}`,
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-10-15T10:00:00.000Z",
    messages: [
      {
        id: `msg-${id}-1`,
        role: "user",
        content: "What should I pack?",
        createdAt: "2026-10-15T10:00:00.000Z",
      },
      {
        id: `msg-${id}-2`,
        role: "assistant",
        content: "Pack layers and comfortable shoes.",
        createdAt: "2026-10-15T10:01:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("Cookie Repository & Codec Boundary Hardening (QUAL-03)", () => {
  let cookieJar: ReturnType<typeof createCookieJar>;
  let originalDocumentCookie: PropertyDescriptor | undefined;

  beforeEach(() => {
    cookieJar = createCookieJar();
    originalDocumentCookie = Object.getOwnPropertyDescriptor(
      document,
      "cookie",
    );
    Object.defineProperty(document, "cookie", {
      get: () => cookieJar.cookie,
      set: (value: string) => {
        cookieJar.cookie = value;
      },
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalDocumentCookie) {
      Object.defineProperty(document, "cookie", originalDocumentCookie);
    }
  });

  describe("Oversized payload scenarios and retention caps", () => {
    it("evicts individual conversations exceeding MAX_TOTAL_BYTES without silent plan slicing", () => {
      const massiveContent = "A".repeat(MAX_TOTAL_BYTES + 5000);
      const oversizedConvo = makeSampleConversation("huge-1", {
        messages: [
          {
            id: "msg-huge-1",
            role: "assistant",
            content: massiveContent,
            createdAt: "2026-10-15T10:00:00.000Z",
          },
        ],
      });
      const normalConvo = makeSampleConversation("normal-1");

      const result = writeConversations([oversizedConvo, normalConvo]);

      expect(result.evicted).toContain("huge-1");
      expect(result.conversations.map((c) => c.id)).toEqual(["normal-1"]);

      const readBack = readConversations();
      expect(readBack.conversations.map((c) => c.id)).toEqual(["normal-1"]);
    });

    it("evicts oldest conversations first when combined size exceeds budget", () => {
      const chunk = "X".repeat(12000);
      const convo1 = makeSampleConversation("c1", {
        updatedAt: "2026-10-01T10:00:00.000Z",
        messages: [{ id: "m1", role: "assistant", content: chunk, createdAt: "2026-10-01T10:00:00.000Z" }],
      });
      const convo2 = makeSampleConversation("c2", {
        updatedAt: "2026-10-02T10:00:00.000Z",
        messages: [{ id: "m2", role: "assistant", content: chunk, createdAt: "2026-10-02T10:00:00.000Z" }],
      });
      const convo3 = makeSampleConversation("c3", {
        updatedAt: "2026-10-03T10:00:00.000Z",
        messages: [{ id: "m3", role: "assistant", content: chunk, createdAt: "2026-10-03T10:00:00.000Z" }],
      });
      const convo4 = makeSampleConversation("c4", {
        updatedAt: "2026-10-04T10:00:00.000Z",
        messages: [{ id: "m4", role: "assistant", content: chunk, createdAt: "2026-10-04T10:00:00.000Z" }],
      });
      const convo5 = makeSampleConversation("c5", {
        updatedAt: "2026-10-05T10:00:00.000Z",
        messages: [{ id: "m5", role: "assistant", content: chunk, createdAt: "2026-10-05T10:00:00.000Z" }],
      });

      const writeResult = writeConversations([convo1, convo2, convo3, convo4, convo5]);
      expect(writeResult.evicted.length).toBeGreaterThan(0);
      expect(writeResult.evicted).toContain("c1");
      expect(writeResult.conversations.some((c) => c.id === "c5")).toBe(true);
    });
  });

  describe("Schema tampering and version boundary resilience", () => {
    it("safely falls back to empty state on future or unknown schema versions", () => {
      const valid = makeSampleConversation("convo-1");
      const { index, chunks } = encodeEnvelope({
        version: 1,
        conversations: [valid],
      });

      // Tamper with index version to 2
      const futureIndex = index.replace(`"version":1`, `"version":2`);
      document.cookie = `${INDEX_COOKIE}=${encodeURIComponent(futureIndex)}`;
      chunks.forEach((chunk, i) => {
        document.cookie = `${dataCookieName(i)}=${encodeURIComponent(chunk)}`;
      });

      const readBack = readConversations();
      expect(readBack.conversations).toEqual([]);
      expect(readBack.recovered).toBe(false);
    });

    it("safely falls back to empty state on completely missing version field", () => {
      const corruptIndex = JSON.stringify({ count: 1, totalSize: 50, segments: [] });
      document.cookie = `${INDEX_COOKIE}=${encodeURIComponent(corruptIndex)}`;

      const readBack = readConversations();
      expect(readBack.conversations).toEqual([]);
    });

    it("rejects tampered conversations with invalid timestamps via strict Zod parsing", () => {
      const c1 = makeSampleConversation("c1", {
        createdAt: "not-a-valid-date" as unknown as string,
      });

      const indexValue = JSON.stringify({
        version: 1,
        count: 1,
        totalSize: 100,
        segments: [{ id: "c1", count: 1 }],
      });

      const chunkValue = encodeURIComponent(JSON.stringify(c1));
      const decoded = decodeEnvelopeSafe(indexValue, [chunkValue]);

      expect(decoded.ok).toBe(true);
      expect(decoded.dropped).toContain("c1");
      expect(decoded.envelope?.conversations).toEqual([]);
      expect(decoded.recovered).toBe(true);
    });

    it("rejects conversations containing injected unauthorized properties (strict schema)", () => {
      const injected = {
        ...makeSampleConversation("c-injected"),
        adminKey: "secret_12345",
        authToken: "bearer_xyz",
      };

      const indexValue = JSON.stringify({
        version: 1,
        count: 1,
        totalSize: 100,
        segments: [{ id: "c-injected", count: 1 }],
      });

      const chunkValue = encodeURIComponent(JSON.stringify(injected));
      const decoded = decodeEnvelopeSafe(indexValue, [chunkValue]);

      expect(decoded.ok).toBe(true);
      expect(decoded.dropped).toContain("c-injected");
      expect(decoded.envelope?.conversations).toEqual([]);
    });
  });

  describe("Corrupted encoding and partial shard drop handling", () => {
    it("handles invalid URI percent-encoding in cookies without throwing", () => {
      document.cookie = `${INDEX_COOKIE}=%E0%A4%A`; // Malformed UTF-8 sequence for decodeURIComponent

      expect(() => {
        const result = readConversations();
        expect(result.conversations).toEqual([]);
      }).not.toThrow();
    });

    it("handles corrupted non-JSON strings in cookie index gracefully", () => {
      document.cookie = `${INDEX_COOKIE}=this_is_not_json{{{`;

      const result = readConversations();
      expect(result.conversations).toEqual([]);
      expect(result.recovered).toBe(false);
    });

    it("salvages intact conversations when one shard is lost or deleted (partial shard drop)", () => {
      const c1 = makeSampleConversation("survivor-1");
      const c2 = makeSampleConversation("lost-2");

      writeConversations([c1, c2]);

      // Intentionally delete or corrupt data cookie shard for c2
      // In repository.ts, chunks are written sequentially
      // Let's find and delete the last shard
      const names = Array.from(cookieJar.rawMap.keys());
      const dataCookies = names.filter((n) => n.startsWith("waynora_chat_") && n !== INDEX_COOKIE);
      expect(dataCookies.length).toBeGreaterThanOrEqual(2);

      // Delete the second data cookie
      cookieJar.rawMap.delete(dataCookies[1]!);

      const result = readConversations();
      expect(result.recovered).toBe(true);
      expect(result.conversations.length).toBe(1);
      expect(result.conversations[0]?.id).toBe("survivor-1");
    });

    it("handles corrupted base64 or garbage data inside a shard without throwing", () => {
      const c1 = makeSampleConversation("valid-1");
      writeConversations([c1]);

      // Corrupt data cookie 0 with unparseable garbage
      cookieJar.rawMap.set(dataCookieName(0), encodeURIComponent("GARBAGE_PAYLOAD_%$#@!*&"));

      expect(() => {
        const result = readConversations();
        expect(result.conversations).toEqual([]);
      }).not.toThrow();
    });
  });
});
