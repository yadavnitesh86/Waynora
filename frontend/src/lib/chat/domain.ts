import type { Conversation, Message } from "../cookie/schema";

/**
 * Pure chat-domain operations (D-24..D-29).
 *
 * Every function takes state and returns new state: nothing here
 * mutates its inputs, touches the DOM, or imports a UI
 * framework, so the whole conversation lifecycle is testable
 * without a browser (D-29). These functions produce the data
 * the cookie repository persists; the repository owns all
 * storage concerns.
 */

/** Creates an empty conversation titled "New chat" (D-24, D-26). */
export function createConversation(id: string, now: string): Conversation {
  return {
    id,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

/** Creates a message with no runtime metadata (D-25). */
export function createMessage(
  id: string,
  role: "user" | "assistant",
  content: string,
  now: string,
): Message {
  return { id, role, content, createdAt: now };
}

/**
 * Appends a message and advances `updatedAt` to the message's
 * creation time, so retention eviction (FIFO by `updatedAt`) sees
 * this conversation as the most recently touched.
 */
export function addMessage(conv: Conversation, msg: Message): Conversation {
  return {
    ...conv,
    messages: [...conv.messages, msg],
    updatedAt: msg.createdAt,
  };
}

/** Patches the message with `id`, leaving every other message untouched. */
export function updateMessage(
  conv: Conversation,
  id: string,
  patch: Partial<Message>,
): Conversation {
  return {
    ...conv,
    messages: conv.messages.map((message) =>
      message.id === id ? { ...message, ...patch } : message,
    ),
  };
}

/**
 * Derives the conversation title from the first user message (D-26):
 * its content truncated to 50 characters, or "New chat" when there
 * is no user message or its content is blank.
 */
export function deriveTitle(messages: Message[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser || firstUser.content.trim().length === 0) {
    return "New chat";
  }
  return firstUser.content.slice(0, 50);
}

/**
 * Marks a message as in-flight (D-27): a conservative boolean flag,
 * plus the marking time recorded on `updatedAt` — the cookie
 * schema's message metadata is a strictObject with no timestamp
 * field, so the conversation's own timestamp carries the "when".
 * The conversation thereby becomes the most recently updated one,
 * which is also what retention eviction should protect.
 */
export function markInFlight(
  conv: Conversation,
  id: string,
  now: string,
): Conversation {
  return {
    ...conv,
    updatedAt: now,
    messages: conv.messages.map((message) =>
      message.id === id
        ? { ...message, metadata: { ...message.metadata, inFlight: true } }
        : message,
    ),
  };
}

/**
 * Attaches a failure to a message (D-28): the submitted content and
 * all existing metadata survive, `inFlight` clears, and the
 * customer-safe error string is stored. The user can see what
 * failed and choose to retry.
 */
export function markError(
  conv: Conversation,
  id: string,
  error: string,
): Conversation {
  return {
    ...conv,
    messages: conv.messages.map((message) =>
      message.id === id
        ? {
            ...message,
            metadata: { ...message.metadata, inFlight: false, error },
          }
        : message,
    ),
  };
}
