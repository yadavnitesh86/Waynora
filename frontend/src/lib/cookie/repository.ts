import { isDev } from "../env";
import {
  INDEX_COOKIE,
  COOKIE_PREFIX,
  dataCookieName,
  decodeEnvelopeSafe,
} from "./codec";
import { enforceCap } from "./retention";
import { conversationSchema, cookieEnvelopeSchema } from "./schema";
import type { Conversation } from "./schema";
import { z } from "zod";

/**
 * Conversation repository.
 *
 * Persists chat history to the browser's window.localStorage (Web Storage API),
 * scoped to the origin. Cookies are no longer used for chat storage, preventing
 * HTTP 431 (Request Header Fields Too Large) errors on API requests.
 *
 * Automatically migrates existing legacy chat cookies to localStorage on read,
 * and clears legacy chat-history cookies without touching any unrelated cookies.
 */

export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export const COOKIE_ATTRIBUTES = "SameSite=Lax; Secure; Path=/";
export const STORAGE_KEY = "waynora_chat_history";

export type StorageResult = {
  conversations: Conversation[];
  /** True when a partial read salvaged some conversations and dropped others. */
  recovered: boolean;
  /** IDs of conversations evicted by the retention caps (D-20). */
  evicted: string[];
};

const EMPTY_RESULT: StorageResult = {
  conversations: [],
  recovered: false,
  evicted: [],
};

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(String(key), String(value));
    },
  };
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // In restricted iframe or private browsing mode, localStorage can throw
    return null;
  }
  // In node-based test environments where document is stubbed:
  try {
    if (typeof document !== "undefined") {
      const doc = document as unknown as { __localStorage?: Storage };
      if (doc && !doc.__localStorage) {
        doc.__localStorage = createMemoryStorage();
      }
      if (doc && doc.__localStorage) {
        return doc.__localStorage;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function hasDocumentCookie(): boolean {
  return typeof document !== "undefined" && "cookie" in document;
}

function getCookie(name: string): string | null {
  if (!hasDocumentCookie()) return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  if (!match) return null;
  const encoded = match[1];
  if (encoded === undefined) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function deleteCookie(name: string): void {
  if (!hasDocumentCookie()) return;
  document.cookie = `${name}=; ${COOKIE_ATTRIBUTES}; Max-Age=0`;
  document.cookie = `${name}=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/** Parses just the `count` field of the index cookie; null when malformed. */
function chunkCountOf(indexValue: string): number {
  try {
    const parsed = JSON.parse(indexValue) as { count?: unknown };
    return typeof parsed.count === "number" ? parsed.count : 0;
  } catch {
    return 0;
  }
}

/** Reads the whole shard set the index cookie describes. */
function readShards(indexValue: string): Array<string | null> {
  const shards: Array<string | null> = [];
  const max = chunkCountOf(indexValue);
  for (let i = 0; ; i += 1) {
    const shard = getCookie(dataCookieName(i));
    if (shard === null) break;
    shards.push(shard);
    if (i > max) break;
  }
  return shards;
}

/**
 * Removes only cookies confirmed to belong to conversation storage:
 * `INDEX_COOKIE` (`waynora_chat_index`) and shard cookies (`waynora_chat_*`).
 * Does not remove or modify other cookies (auth, session, etc.).
 */
export function deleteChatCookies(): void {
  if (!hasDocumentCookie()) return;

  const indexValue = getCookie(INDEX_COOKIE);
  const count = indexValue ? chunkCountOf(indexValue) : 0;
  for (let i = 0; i < Math.max(count, 50); i += 1) {
    deleteCookie(dataCookieName(i));
  }
  deleteCookie(INDEX_COOKIE);

  try {
    const rawCookies = document.cookie.split(";");
    for (const raw of rawCookies) {
      const trimmed = raw.trim();
      const eqIdx = trimmed.indexOf("=");
      const name = eqIdx === -1 ? trimmed : trimmed.slice(0, eqIdx);
      if (name === INDEX_COOKIE || name.startsWith(COOKIE_PREFIX)) {
        deleteCookie(name);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Migrates legacy conversation cookies into localStorage if present and valid.
 * Removes only conversation cookies upon completion.
 */
function migrateFromCookies(storage: Storage | null): StorageResult | null {
  if (!hasDocumentCookie()) return null;

  const indexValue = getCookie(INDEX_COOKIE);
  if (indexValue === null) {
    deleteChatCookies();
    return null;
  }

  try {
    const shards = readShards(indexValue);
    const decoded = decodeEnvelopeSafe(indexValue, shards);

    if (decoded.ok && decoded.envelope && decoded.envelope.conversations.length > 0) {
      const conversations = decoded.envelope.conversations;
      if (storage) {
        try {
          storage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              version: 1,
              conversations,
            }),
          );
        } catch (err) {
          if (isDev) {
            console.error("[storage] failed to migrate cookie chat to localStorage:", err);
          }
        }
      }

      deleteChatCookies();
      return {
        conversations,
        recovered: decoded.recovered,
        evicted: [],
      };
    }
  } catch (err) {
    if (isDev) {
      console.error("[storage] error during cookie migration:", err);
    }
  }

  deleteChatCookies();
  return null;
}

/**
 * Reads conversations from localStorage (or migrates from legacy cookies).
 * Never throws: missing or malformed saved data safely returns an empty chat.
 */
export function readConversations(): StorageResult {
  const storage = getLocalStorage();

  if (storage) {
    try {
      const raw =
        storage.getItem(STORAGE_KEY) ?? storage.getItem("waynora_chat_conversations");
      if (raw !== null) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          if (isDev) {
            console.error(
              "[storage] corrupted JSON in localStorage, resetting to empty chat",
            );
          }
          return EMPTY_RESULT;
        }

        // Validate schema envelope
        const envelopeResult = cookieEnvelopeSchema.safeParse(parsed);
        if (envelopeResult.success) {
          deleteChatCookies();
          return {
            conversations: envelopeResult.data.conversations,
            recovered: false,
            evicted: [],
          };
        }

        // Fallback for raw array of conversations
        if (Array.isArray(parsed)) {
          const listResult = z.array(conversationSchema).safeParse(parsed);
          if (listResult.success) {
            deleteChatCookies();
            return {
              conversations: listResult.data,
              recovered: false,
              evicted: [],
            };
          }
        }

        if (isDev) {
          console.error(
            "[storage] invalid saved chat data in localStorage, starting with empty chat",
          );
        }
        return EMPTY_RESULT;
      }
    } catch (err) {
      if (isDev) {
        console.error("[storage] error reading from localStorage:", err);
      }
      return EMPTY_RESULT;
    }
  }

  const migrated = migrateFromCookies(storage);
  if (migrated !== null) {
    return migrated;
  }

  return EMPTY_RESULT;
}

/**
 * Writes conversations to localStorage under retention caps.
 * Clears any legacy chat cookies to prevent headers from bloating.
 */
export function writeConversations(conversations: Conversation[]): StorageResult {
  const capped = enforceCap(conversations);
  const storage = getLocalStorage();

  if (storage) {
    try {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          conversations: capped.conversations,
        }),
      );
    } catch (err) {
      if (isDev) {
        console.error(
          "[storage] failed to write conversations to localStorage:",
          err,
        );
      }
    }
  }

  deleteChatCookies();

  if (capped.evicted.length > 0 && isDev) {
    console.error("[storage] retention capped, evicted:", capped.evicted);
  }

  return {
    conversations: capped.conversations,
    recovered: false,
    evicted: capped.evicted,
  };
}
