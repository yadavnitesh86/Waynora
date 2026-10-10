import { describe, expect, it } from "vitest";
import {
  conversationSchema,
  cookieEnvelopeSchema,
  messageSchema,
} from "./schema";

/**
 * The cookie data model is the trust boundary between untrusted
 * `document.cookie` data and application state (D-21). Every field is
 * enumerated here, including the rejections that make "no secrets in cookies"
 * (D-23) true by construction rather than by convention.
 */

const AT = "2026-01-01T00:00:00Z";

function validMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "m-1",
    role: "user" as const,
    content: "Plan a trip to Japan",
    createdAt: AT,
    ...overrides,
  };
}

function validConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    title: "Trip to Japan",
    createdAt: AT,
    updatedAt: AT,
    messages: [validMessage()],
    ...overrides,
  };
}

describe("messageSchema boundary", () => {
  it("accepts a well-formed user message", () => {
    expect(messageSchema.safeParse(validMessage()).success).toBe(true);
  });

  it("accepts an assistant message without metadata", () => {
    expect(
      messageSchema.safeParse(
        validMessage({ id: "m-2", role: "assistant", content: "Here is a plan" }),
      ).success,
    ).toBe(true);
  });

  it("accepts optional metadata with only the in-flight flag", () => {
    expect(
      messageSchema
        .safeParse(validMessage({ metadata: { inFlight: true } })).success,
    ).toBe(true);
  });

  it("accepts optional metadata with an error and threadId", () => {
    expect(
      messageSchema
        .safeParse({
          ...validMessage(),
          metadata: { error: "Request failed", threadId: "t-1" },
        })
        .success,
    ).toBe(true);
  });

  it("rejects role other than user or assistant", () => {
    expect(
      messageSchema.safeParse(validMessage({ role: "system" })).success,
    ).toBe(false);
  });

  it("rejects an empty id", () => {
    expect(messageSchema.safeParse(validMessage({ id: "" })).success).toBe(
      false,
    );
  });

  it("rejects a non-timestamp createdAt", () => {
    expect(
      messageSchema.safeParse(validMessage({ createdAt: "yesterday" }))
        .success,
    ).toBe(false);
  });

  it("rejects an unknown message key, including a secret-shaped one", () => {
    expect(
      messageSchema.safeParse(validMessage({ apiKey: "sk-live-123" }))
        .success,
    ).toBe(false);
  });

  it("rejects an unknown metadata key", () => {
    expect(
      messageSchema
        .safeParse(validMessage({ metadata: { token: "abc" } }))
        .success,
    ).toBe(false);
  });

  it("rejects a missing createdAt", () => {
    expect(
      messageSchema
        .safeParse({
          id: "m-1",
          role: "user",
          content: "Plan a trip to Japan",
        })
        .success,
    ).toBe(false);
  });
});

describe("conversationSchema boundary", () => {
  it("accepts a well-formed conversation", () => {
    expect(conversationSchema.safeParse(validConversation()).success).toBe(
      true,
    );
  });

  it("accepts a conversation with a backend threadId", () => {
    expect(
      conversationSchema
        .safeParse(validConversation({ threadId: "thread-42" })).success,
    ).toBe(true);
  });

  it("rejects an empty id", () => {
    expect(
      conversationSchema.safeParse(validConversation({ id: "" })).success,
    ).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(
      conversationSchema.safeParse(validConversation({ title: "" })).success,
    ).toBe(false);
  });

  it("rejects a missing messages array", () => {
    expect(
      conversationSchema
        .safeParse({
          id: "c-1",
          title: "Trip to Japan",
          createdAt: AT,
          updatedAt: AT,
        })
        .success,
    ).toBe(false);
  });

  it("rejects a malformed nested message", () => {
    expect(
      conversationSchema
        .safeParse(validConversation({ messages: [validMessage({ role: "tool" })] }))
        .success,
    ).toBe(false);
  });

  it("rejects an unknown conversation key", () => {
    expect(
      conversationSchema
        .safeParse(validConversation({ password: "hunter2" })).success,
    ).toBe(false);
  });
});

describe("cookieEnvelopeSchema boundary", () => {
  it("accepts version 1 with a conversation list", () => {
    expect(
      cookieEnvelopeSchema
        .safeParse({ version: 1, conversations: [validConversation()] })
        .success,
    ).toBe(true);
  });

  it("accepts version 1 with an empty conversation list", () => {
    expect(
      cookieEnvelopeSchema.safeParse({ version: 1, conversations: [] })
        .success,
    ).toBe(true);
  });

  it("rejects version 2 (D-16: unrecognized version is discarded)", () => {
    expect(
      cookieEnvelopeSchema
        .safeParse({ version: 2, conversations: [] }).success,
    ).toBe(false);
  });

  it("rejects a missing version", () => {
    expect(
      cookieEnvelopeSchema.safeParse({ conversations: [] }).success,
    ).toBe(false);
  });

  it("rejects an unknown envelope key", () => {
    expect(
      cookieEnvelopeSchema
        .safeParse({ version: 1, conversations: [], secret: "abc" }).success,
    ).toBe(false);
  });

  it("rejects a payload carrying a malformed conversation", () => {
    expect(
      cookieEnvelopeSchema
        .safeParse({
          version: 1,
          conversations: [{ id: "c-1", title: "t", createdAt: AT, updatedAt: AT }],
        })
        .success,
    ).toBe(false);
  });
});
