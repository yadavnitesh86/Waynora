import { z } from "zod";

/**
 * Cookie data model (D-24, D-25, D-16, D-23).
 *
 * These schemas are the trust boundary between untrusted `document.cookie`
 * data and application state: every read is validated here before it enters
 * state. `strictObject` at every level means an unknown key — including a
 * secret-shaped one — is a parse error rather than a silent pass-through, which
 * is how "no passwords, tokens, API keys, or secrets in cookies" (D-23) is
 * enforced by construction instead of by convention.
 */

/** Optional per-message runtime state (D-25, D-27). */
export const messageMetadataSchema = z.strictObject({
  inFlight: z.boolean().optional(),
  error: z.string().optional(),
  threadId: z.string().optional(),
});

export const messageSchema = z.strictObject({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  // ISO-8601 with a Z offset, which is what `new Date().toISOString()`
  // produces. Anything looser accepts junk that breaks updatedAt sorting.
  createdAt: z.string().datetime(),
  metadata: messageMetadataSchema.optional(),
});

export const conversationSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messages: z.array(messageSchema),
  // Backend threading key returned by `POST /ask`; absent until the first
  // successful response (D-24).
  threadId: z.string().optional(),
});

export const cookieEnvelopeSchema = z.strictObject({
  // D-16: an unrecognized version discards the whole snapshot — there is no
  // partial migration path, so `literal(1)` is the entire version contract.
  version: z.literal(1),
  conversations: z.array(conversationSchema),
});

export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type CookieEnvelope = z.infer<typeof cookieEnvelopeSchema>;
