import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { INDEX_COOKIE } from "./codec";
import {
  COOKIE_ATTRIBUTES,
  COOKIE_MAX_AGE,
  readConversations,
  writeConversations,
} from "./repository";
import type { Conversation } from "./schema";

vi.mock("../env", () => ({
  env: {
    VITE_API_BASE_URL: "http://localhost:8000",
    VITE_CONVEX_URL: "https://example.convex.cloud",
  },
  envError: [],
  isDev: false,
}));

/**
 * `document.cookie` is a single string, so a plain object assignment overwrites
 * instead of appending — which would make the "data chunks first, index last"
 * contract untestable. This mock behaves like the real browser jar: writes set
 * one named cookie, `Max-Age<=0` deletes, reads render every stored cookie.
 */
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
  };
}

function cookieNamesInJar(jar: { cookie: string }): string[] {
  return jar.cookie
    .split("; ")
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.slice(0, entry.indexOf("=")));
}

/** Removes one named cookie the way a browser honours `Max-Age=0`. */
function expireCookie(jar: { cookie: string }, name: string): void {
  jar.cookie = `${name}=; ${COOKIE_ATTRIBUTES}; Max-Age=0`;
}

/**
 * Records every raw `document.cookie` assignment so cookie attributes — which a
 * real jar consumes rather than stores — can still be asserted.
 */
function captureWrites(jar: {
  cookie: string;
}): { names: string[]; raw: string[] } {
  const names: string[] = [];
  const raw: string[] = [];
  const descriptor = Object.getOwnPropertyDescriptor(jar, "cookie")!;

  Object.defineProperty(jar, "cookie", {
    get: descriptor.get,
    set(value: string) {
      names.push(value.slice(0, value.indexOf("=")));
      raw.push(value);
      descriptor.set!.call(jar, value);
    },
    configurable: true,
  });

  return { names, raw };
}

const AT = "2026-01-01T00:00:00Z";

function conversation(
  id: string,
  updatedAt = "2026-01-02T00:00:00Z",
): Conversation {
  return {
    id,
    title: `Conversation ${id}`,
    createdAt: AT,
    updatedAt,
    messages: [
      { id: `${id}-m1`, role: "user", content: "Plan a trip", createdAt: AT },
    ],
  };
}

const EMPTY_RESULT = { conversations: [], recovered: false, evicted: [] };

describe("cookie repository", () => {
  let jar: ReturnType<typeof createCookieJar>;

  beforeEach(() => {
    jar = createCookieJar();
    vi.stubGlobal("document", jar);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Persisted order is retention order — newest first — because every write
   * runs through `enforceCap` before the shards are laid out (D-19).
   */
  describe("readConversations", () => {
    it("returns an empty state when no cookies exist", () => {
      expect(readConversations()).toEqual(EMPTY_RESULT);
    });

    it("returns parsed conversations when valid cookies exist", () => {
      const conversations = [
        conversation("c-1", "2026-01-03T00:00:00Z"),
        conversation("c-2"),
      ];
      writeConversations(conversations);

      expect(readConversations()).toEqual({
        conversations,
        recovered: false,
        evicted: [],
      });
    });

    it("returns an empty state when the index cookie is malformed (D-21)", () => {
      jar.cookie = `${INDEX_COOKIE}=~~~not-json~~~`;

      expect(readConversations()).toEqual(EMPTY_RESULT);
    });

    it("returns an empty state when data cookies exist but the index does not (D-21)", () => {
      jar.cookie = `waynora_chat_0=%7B%22version%22%3A1%7D`;

      expect(readConversations().conversations).toEqual([]);
    });

    it("reports recovery when the shard the index points at is missing (D-22)", () => {
      writeConversations([conversation("c-1", "2026-01-03T00:00:00Z")]);
      const indexBefore = indexCookieValueOf(jar);
      expireCookie(jar, "waynora_chat_0");

      const result = readConversations();

      expect(result.recovered).toBe(true);
      expect(result.conversations).toEqual([]);
      expect(indexCookieValueOf(jar)).toBe(indexBefore);
    });

    it("salvages intact conversations when one shard is missing (D-22)", () => {
      // Shard 0 carries the newest conversation, shard 1 the older one.
      writeConversations([
        conversation("c-1", "2026-01-03T00:00:00Z"),
        conversation("c-2"),
      ]);
      expireCookie(jar, "waynora_chat_1");

      const result = readConversations();

      expect(result.recovered).toBe(true);
      expect(result.conversations).toEqual([
        conversation("c-1", "2026-01-03T00:00:00Z"),
      ]);
    });

    it("salvages intact conversations when one shard is corrupt (D-22)", () => {
      writeConversations([
        conversation("c-1", "2026-01-03T00:00:00Z"),
        conversation("c-2"),
      ]);
      jar.cookie = `waynora_chat_1=%E0%A4%A`;

      expect(readConversations().conversations).toEqual([
        conversation("c-1", "2026-01-03T00:00:00Z"),
      ]);
    });

    it("returns an empty state for an unsupported envelope version (D-16)", () => {
      writeConversations([conversation("c-1", "2026-01-03T00:00:00Z")]);
      const tampered = JSON.stringify({
        ...(JSON.parse(indexCookieValueOf(jar)) as Record<string, unknown>),
        version: 2,
      });
      jar.cookie = `${INDEX_COOKIE}=${encodeURIComponent(tampered)}`;

      expect(readConversations()).toEqual(EMPTY_RESULT);
    });

    it("never throws on a hostile cookie string", () => {
      jar.cookie = "waynora_chat_index=%;%%%; waynora_chat_0=%E0%A4%A";

      expect(() => readConversations()).not.toThrow();
      expect(readConversations().conversations).toEqual([]);
    });
  });

  describe("writeConversations", () => {
    it("returns the written conversations with no evictions", () => {
      const conversations = [conversation("c-1")];

      expect(writeConversations(conversations)).toEqual({
        conversations,
        recovered: false,
        evicted: [],
      });
    });

    it("writes the index cookie last so a partial write is detectable (Pitfall 2)", () => {
      const writes = captureWrites(jar);

      writeConversations([
        conversation("c-1"),
        conversation("c-2", "2026-01-03T00:00:00Z"),
      ]);

      expect(writes.names[writes.names.length - 1]).toBe(INDEX_COOKIE);
      expect(writes.names.indexOf(INDEX_COOKIE)).toBeGreaterThan(0);
      expect(writes.names.filter((name) => name === INDEX_COOKIE)).toHaveLength(
        1,
      );
    });

    it("sets SameSite, Secure, Path and Max-Age on every cookie (D-17)", () => {
      const writes = captureWrites(jar);

      writeConversations([conversation("c-1")]);

      expect(writes.raw.length).toBeGreaterThan(0);
      for (const raw of writes.raw) {
        expect(raw).toContain(
          `SameSite=Lax; Secure; Path=/; Max-Age=${COOKIE_MAX_AGE}`,
        );
      }
    });

    it("locks the retention window to 30 days", () => {
      expect(COOKIE_MAX_AGE).toBe(30 * 24 * 60 * 60);
      expect(COOKIE_ATTRIBUTES).toBe("SameSite=Lax; Secure; Path=/");
    });

    it("round-trips through a read after writing", () => {
      // Written in arbitrary order; read back in retention order (newest first).
      const newest = conversation("c-1", "2026-01-03T00:00:00Z");
      const oldest = conversation("c-2");

      writeConversations([oldest, newest]);

      expect(readConversations().conversations).toEqual([newest, oldest]);
    });

    it("drops stale data cookies left by an earlier, larger snapshot", () => {
      writeConversations(
        Array.from({ length: 5 }, (_, i) =>
          conversation(`c-${i}`, `2026-01-0${i + 2}T00:00:00Z`),
        ),
      );
      const staleCookieCount = cookieNamesInJar(jar).length;

      writeConversations([conversation("c-1")]);

      expect(cookieNamesInJar(jar).length).toBeLessThan(staleCookieCount);
      expect(readConversations().conversations).toEqual([
        conversation("c-1"),
      ]);
    });

    it("clears the snapshot when writing an empty conversation list", () => {
      writeConversations([conversation("c-1")]);
      writeConversations([]);

      expect(readConversations()).toEqual(EMPTY_RESULT);
      expect(cookieNamesInJar(jar)).toEqual([INDEX_COOKIE]);
    });

    it("returns retention's survivor ordering, newest first (D-20)", () => {
      const result = writeConversations(
        Array.from({ length: 3 }, (_, i) =>
          conversation(`c-${i}`, `2026-01-0${i + 2}T00:00:00Z`),
        ),
      );

      expect(result.evicted).toEqual([]);
      expect(result.conversations.map((c) => c.id)).toEqual(["c-2", "c-1", "c-0"]);
    });
  });
});

/** Reader helper: the decoded index cookie value the repository persisted. */
function indexCookieValueOf(jar: { cookie: string }): string {
  const entry = jar.cookie
    .split("; ")
    .find((candidate) => candidate.startsWith(`${INDEX_COOKIE}=`));
  if (!entry) return "";
  return decodeURIComponent(entry.slice(`${INDEX_COOKIE}=`.length));
}
