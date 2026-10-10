import { z } from "zod";
import { conversationSchema, cookieEnvelopeSchema } from "./schema";
import type { Conversation, CookieEnvelope } from "./schema";

/**
 * Cookie chunk codec (D-15, D-16, D-18).
 *
 * The whole snapshot lives in one versioned JSON envelope, sharded across
 * multiple `document.cookie` entries to stay under the ~4 KB per-cookie limit.
 * An index cookie records how the shards are laid out; the data cookies
 * (`waynora_chat_0`, `waynora_chat_1`, …) carry the payload.
 *
 * Shard boundaries fall on conversation edges rather than at fixed character
 * windows. That costs a little space (a shard is never filled to the brim) and
 * buys D-22: a single lost or corrupt shard costs exactly one conversation
 * instead of the entire snapshot.
 */

export const CHUNK_SIZE = 3500;
export const COOKIE_PREFIX = "waynora_chat_";
export const INDEX_COOKIE = "waynora_chat_index";
export const ENVELOPE_VERSION = 1;

/** Raw JSON held by one data cookie, before percent-encoding for transport. */
type RawChunk = string | null | undefined;

export const envelopeIndexSchema = z.strictObject({
  version: z.number().int().positive(),
  count: z.number().int().nonnegative(),
  totalSize: z.number().int().nonnegative(),
  segments: z.array(
    z.strictObject({
      id: z.string().min(1),
      count: z.number().int().positive(),
    }),
  ),
});

export type EnvelopeIndex = z.infer<typeof envelopeIndexSchema>;

export type DecodeFailureReason = "index-malformed" | "version-unsupported";

export type DecodeResult = {
  ok: boolean;
  envelope: CookieEnvelope | null;
  /** Conversations dropped because their shards were lost or corrupt. */
  dropped: string[];
  /** True when at least one conversation was dropped but the rest survived. */
  recovered: boolean;
  reason?: DecodeFailureReason;
};

export function chunkString(str: string, size: number): string[] {
  // An empty payload still needs one shard: a zero-shard envelope would be
  // indistinguishable from "nothing was ever written".
  if (str.length === 0) {
    return [""];
  }
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

export function joinChunks(chunks: Array<string | null | undefined>): string {
  return chunks.filter((c) => typeof c === "string").join("");
}

export function dataCookieName(index: number): string {
  return `${COOKIE_PREFIX}${index}`;
}

export function parseEnvelopeIndex(indexValue: string): EnvelopeIndex | null {
  let raw: unknown;
  try {
    raw = JSON.parse(indexValue);
  } catch {
    return null;
  }
  const parsed = envelopeIndexSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function encodeEnvelope(envelope: CookieEnvelope): {
  index: string;
  chunks: string[];
} {
  const validated = cookieEnvelopeSchema.parse(envelope);

  const segments: EnvelopeIndex["segments"] = [];
  const chunks: string[] = [];

  for (const conversation of validated.conversations) {
    const conversationChunks = chunkString(
      encodeURIComponent(JSON.stringify(conversation)),
      CHUNK_SIZE,
    );
    segments.push({ id: conversation.id, count: conversationChunks.length });
    chunks.push(...conversationChunks);
  }

  const index: EnvelopeIndex = {
    version: ENVELOPE_VERSION,
    count: chunks.length,
    // Size of the shard payload as actually written, which is what the
    // retention cap in retention.ts is measured against.
    totalSize: chunks.join("").length,
    segments,
  };

  return { index: JSON.stringify(index), chunks };
}

/**
 * Strict decode: rebuilds every conversation shard, then validates the
 * envelope. Throws on any malformed input — callers that must not throw use
 * `decodeEnvelopeSafe`.
 */
export function decodeEnvelope(
  indexValue: string,
  chunkValues: string[],
): CookieEnvelope {
  const index = parseEnvelopeIndex(indexValue);
  if (!index) {
    throw new Error("[cookie] malformed index cookie");
  }
  if (index.version !== ENVELOPE_VERSION) {
    throw new Error(`[cookie] unsupported envelope version ${index.version}`);
  }

  const conversations: Conversation[] = [];
  let cursor = 0;

  for (const segment of index.segments) {
    const decoded = parseSegment(chunkValues.slice(cursor, cursor + segment.count));
    cursor += segment.count;
    if (decoded === null) {
      throw new Error(`[cookie] corrupt shard for conversation ${segment.id}`);
    }
    conversations.push(decoded);
  }

  return { version: ENVELOPE_VERSION, conversations };
}

/**
 * Total-decode that never throws, and that salvages what it can (D-21, D-22):
 *
 * - malformed index or unsupported version -> `ok: false`, empty snapshot
 *   (D-16: never migrate partially; D-21: never crash)
 * - some shards lost or corrupt -> the conversations they carried are dropped,
 *   `recovered: true`, the rest are returned intact
 */
export function decodeEnvelopeSafe(
  indexValue: string,
  chunkValues: RawChunk[],
): DecodeResult {
  const index = parseEnvelopeIndex(indexValue);
  if (!index) {
    return failure("index-malformed");
  }
  if (index.version !== ENVELOPE_VERSION) {
    return failure("version-unsupported");
  }

  const survivors: Conversation[] = [];
  const dropped: string[] = [];
  let cursor = 0;

  for (const segment of index.segments) {
    const shards = chunkValues.slice(cursor, cursor + segment.count);
    cursor += segment.count;

    const decoded = parseSegment(shards);
    if (decoded === null) {
      dropped.push(segment.id);
      continue;
    }
    survivors.push(decoded);
  }

  const envelope: CookieEnvelope = {
    version: ENVELOPE_VERSION,
    conversations: survivors,
  };

  return {
    ok: true,
    envelope,
    dropped,
    recovered: dropped.length > 0,
  };
}

/**
 * Rebuilds one conversation from its own shard range. Returns null (rather
 * than throwing) when any shard is missing or the reconstructed payload fails
 * schema validation.
 */
function parseSegment(shards: RawChunk[]): Conversation | null {
  if (shards.length === 0 || shards.some((s) => typeof s !== "string")) {
    return null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(decodeURIComponent(joinChunks(shards)));
  } catch {
    return null;
  }

  const parsed = conversationSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function failure(reason: DecodeFailureReason): DecodeResult {
  return { ok: false, envelope: null, dropped: [], recovered: false, reason };
}
