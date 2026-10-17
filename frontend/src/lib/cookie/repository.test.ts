import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { INDEX_COOKIE, dataCookieName } from "./codec";
import {
  COOKIE_ATTRIBUTES,
  COOKIE_MAX_AGE,
  STORAGE_KEY,
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

function cookieNamesInJar(jar: { cookie: string }): string[] {
  return jar.cookie
    .split("; ")
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.slice(0, entry.indexOf("=")));
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

describe("conversation repository (localStorage persistence)", () => {
  let jar: ReturnType<typeof createCookieJar>;

  beforeEach(() => {
    window.localStorage.clear();
    jar = createCookieJar();
    vi.stubGlobal("document", jar);
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("readConversations", () => {
    it("returns an empty state when localStorage is empty and no cookies exist", () => {
      expect(readConversations()).toEqual(EMPTY_RESULT);
    });

    it("returns parsed conversations when valid data exists in localStorage", () => {
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

    it("returns an empty state when localStorage contains corrupted non-JSON", () => {
      window.localStorage.setItem(STORAGE_KEY, "~~~not-json~~~");
      expect(readConversations()).toEqual(EMPTY_RESULT);
    });

    it("returns an empty state for an unsupported envelope version in localStorage (D-16)", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 2,
          conversations: [conversation("c-1")],
        }),
      );
      expect(readConversations()).toEqual(EMPTY_RESULT);
    });

    it("never throws on corrupted or hostile data in localStorage", () => {
      window.localStorage.setItem(STORAGE_KEY, "%E0%A4%A {invalid");
      expect(() => readConversations()).not.toThrow();
      expect(readConversations()).toEqual(EMPTY_RESULT);
    });

    it("migrates valid legacy conversation cookies to localStorage and cleans up the cookies", () => {
      const c1 = conversation("c-1", "2026-01-03T00:00:00Z");
      const c2 = conversation("c-2");
      const chunk0 = encodeURIComponent(JSON.stringify(c1));
      const chunk1 = encodeURIComponent(JSON.stringify(c2));

      const legacyIndex = {
        version: 1,
        count: 2,
        totalSize: chunk0.length + chunk1.length,
        segments: [
          { id: "c-1", count: 1 },
          { id: "c-2", count: 1 },
        ],
      };

      jar.cookie = `${INDEX_COOKIE}=${encodeURIComponent(JSON.stringify(legacyIndex))}`;
      jar.cookie = `${dataCookieName(0)}=${chunk0}`;
      jar.cookie = `${dataCookieName(1)}=${chunk1}`;
      jar.cookie = "auth_session=secret_token_123";

      const result = readConversations();
      expect(result.conversations).toEqual([c1, c2]);

      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.conversations).toEqual([c1, c2]);

      expect(cookieNamesInJar(jar)).toEqual(["auth_session"]);
    });

    it("salvages intact conversations when migrating a legacy cookie with a missing shard", () => {
      const c1 = conversation("c-1", "2026-01-03T00:00:00Z");
      const chunk0 = encodeURIComponent(JSON.stringify(c1));

      const legacyIndex = {
        version: 1,
        count: 2,
        totalSize: chunk0.length,
        segments: [
          { id: "c-1", count: 1 },
          { id: "c-2", count: 1 },
        ],
      };

      jar.cookie = `${INDEX_COOKIE}=${encodeURIComponent(JSON.stringify(legacyIndex))}`;
      jar.cookie = `${dataCookieName(0)}=${chunk0}`;

      const result = readConversations();
      expect(result.recovered).toBe(true);
      expect(result.conversations).toEqual([c1]);
    });

    it("cleans up invalid legacy cookies without crashing", () => {
      jar.cookie = `${INDEX_COOKIE}=not-json`;
      jar.cookie = "other_cookie=preserve_me";

      expect(readConversations()).toEqual(EMPTY_RESULT);
      expect(cookieNamesInJar(jar)).toEqual(["other_cookie"]);
    });
  });

  describe("writeConversations", () => {
    it("returns the written conversations and writes directly to window.localStorage", () => {
      const conversations = [conversation("c-1")];

      const result = writeConversations(conversations);
      expect(result).toEqual({
        conversations,
        recovered: false,
        evicted: [],
      });

      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!).conversations).toEqual(conversations);
    });

    it("does not write any chat cookies on writeConversations", () => {
      writeConversations([conversation("c-1")]);
      expect(cookieNamesInJar(jar)).toEqual([]);
    });

    it("removes any existing legacy chat cookies on write, leaving unrelated cookies intact", () => {
      jar.cookie = `${INDEX_COOKIE}=legacy`;
      jar.cookie = `${dataCookieName(0)}=shard`;
      jar.cookie = "user_pref=dark_mode";

      writeConversations([conversation("c-1")]);

      expect(cookieNamesInJar(jar)).toEqual(["user_pref"]);
    });

    it("round-trips through a read after writing", () => {
      const newest = conversation("c-1", "2026-01-03T00:00:00Z");
      const oldest = conversation("c-2");

      writeConversations([oldest, newest]);

      expect(readConversations().conversations).toEqual([newest, oldest]);
    });

    it("clears the snapshot when writing an empty conversation list", () => {
      writeConversations([conversation("c-1")]);
      writeConversations([]);

      expect(readConversations()).toEqual(EMPTY_RESULT);
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(stored!).conversations).toEqual([]);
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

    it("preserves constants COOKIE_MAX_AGE and COOKIE_ATTRIBUTES for compatibility", () => {
      expect(COOKIE_MAX_AGE).toBe(30 * 24 * 60 * 60);
      expect(COOKIE_ATTRIBUTES).toBe("SameSite=Lax; Secure; Path=/");
    });
  });
});
