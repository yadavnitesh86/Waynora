import { isDev } from "../env";
import {
  INDEX_COOKIE,
  dataCookieName,
  decodeEnvelopeSafe,
  encodeEnvelope,
} from "./codec";
import { enforceCap } from "./retention";
import type { Conversation } from "./schema";

/**
 * Cookie repository (D-15, D-17, D-21, D-22).
 *
 * Reads and writes are the only place in the app that touches
 * `document.cookie`. Every read goes through Zod validation with a recovery
 * path, and every write goes through the retention caps first, so the data that
 * reaches this module is trusted and the data that leaves it is bounded.
 */

export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export const COOKIE_ATTRIBUTES = "SameSite=Lax; Secure; Path=/";

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

function hasDocumentCookie(): boolean {
  return typeof document !== "undefined" && "cookie" in document;
}

function setCookie(name: string, value: string): void {
  if (!hasDocumentCookie()) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; ${COOKIE_ATTRIBUTES}; Max-Age=${COOKIE_MAX_AGE}`;
}

function getCookie(name: string): string | null {
  if (!hasDocumentCookie()) return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  // `decodeURIComponent` throws on a malformed percent-escape, and a tampered
  // cookie is exactly where those come from. An undecodable value is a corrupt
  // value, not a crash (D-21).
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
}

/** Reads the whole shard set the index cookie describes. */
function readShards(indexValue: string): Array<string | null> {
  const shards: Array<string | null> = [];
  for (let i = 0; ; i += 1) {
    const shard = getCookie(dataCookieName(i));
    if (shard === null) break;
    shards.push(shard);
    // The index cookie only stores the count, so stop once every described
    // shard has been read even if stale ones linger from an earlier write.
    if (i > chunkCountOf(indexValue)) break;
  }
  return shards;
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

/**
 * Reads the snapshot back. Never throws: a malformed index or an unsupported
 * version yields an empty state (D-21), and lost or corrupt shards cost only
 * the conversations they carried (D-22).
 */
export function readConversations(): StorageResult {
  const indexValue = getCookie(INDEX_COOKIE);
  if (indexValue === null) {
    return EMPTY_RESULT;
  }

  const decoded = decodeEnvelopeSafe(indexValue, readShards(indexValue));
  if (!decoded.ok || decoded.envelope === null) {
    if (isDev) {
      console.error(
        `[cookie] unreadable snapshot (${decoded.reason ?? "unknown"})`,
      );
    }
    return EMPTY_RESULT;
  }

  if (decoded.recovered && isDev) {
    console.error("[cookie] salvaged snapshot, dropped:", decoded.dropped);
  }

  return {
    conversations: decoded.envelope.conversations,
    recovered: decoded.recovered,
    evicted: [],
  };
}

/**
 * Writes the snapshot. Shards are written first and the index cookie last, so a
 * write interrupted mid-flight leaves an index that points at shards that do
 * not exist yet — a detectable state, rather than a half-truth (Pitfall 2).
 */
export function writeConversations(conversations: Conversation[]): StorageResult {
  if (!hasDocumentCookie()) {
    return { ...EMPTY_RESULT, conversations: [] };
  }

  const capped = enforceCap(conversations);
  const { index, chunks } = encodeEnvelope({
    version: 1,
    conversations: capped.conversations,
  });

  const previousCount = chunkCountOf(getCookie(INDEX_COOKIE) ?? "");

  chunks.forEach((chunk, position) => {
    setCookie(dataCookieName(position), chunk);
  });

  // Shards from an earlier, larger snapshot are stale otherwise.
  for (let position = chunks.length; position < previousCount; position += 1) {
    deleteCookie(dataCookieName(position));
  }

  setCookie(INDEX_COOKIE, index);

  if (capped.evicted.length > 0 && isDev) {
    console.error("[cookie] retention capped, evicted:", capped.evicted);
  }

  return {
    conversations: capped.conversations,
    recovered: false,
    evicted: capped.evicted,
  };
}
