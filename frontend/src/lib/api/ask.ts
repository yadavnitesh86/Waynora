import { z } from "zod";
import { env } from "../env";
import { CUSTOMER_MESSAGES, type AskResult } from "../errors";

export const askRequestSchema = z.strictObject({
  question: z.string().min(1),
  thread_id: z.string().min(1).optional(),
});

export const askResponseSchema = z.strictObject({
  answer: z.string().min(1),
  thread_id: z.string().min(1),
});

export type AskRequest = z.infer<typeof askRequestSchema>;
export type AskResponse = z.infer<typeof askResponseSchema>;

export async function askBackend(
  request: AskRequest,
  signal?: AbortSignal,
): Promise<AskResult> {
  let response: Response;
  try {
    response = await fetch(`${env.VITE_API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(askRequestSchema.parse(request)),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, kind: "abort", message: CUSTOMER_MESSAGES.abort };
    }
    if (import.meta.env.DEV) {
      console.error("[ask] Network error", err);
    }
    return { ok: false, kind: "network", message: CUSTOMER_MESSAGES.network };
  }

  if (!response.ok) {
    if (import.meta.env.DEV) {
      console.error(`[ask] HTTP ${response.status}`);
    }
    return { ok: false, kind: "http", message: CUSTOMER_MESSAGES.http };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (import.meta.env.DEV) {
      console.error("[ask] Failed to parse response body as JSON");
    }
    return { ok: false, kind: "malformed", message: CUSTOMER_MESSAGES.malformed };
  }

  const parsed = askResponseSchema.safeParse(body);
  if (!parsed.success) {
    if (import.meta.env.DEV) {
      console.error("[ask] Malformed response", parsed.error);
    }
    return { ok: false, kind: "malformed", message: CUSTOMER_MESSAGES.malformed };
  }

  return { ok: true, answer: parsed.data.answer, threadId: parsed.data.thread_id };
}
