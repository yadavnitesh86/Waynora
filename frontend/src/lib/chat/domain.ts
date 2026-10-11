import type { Conversation, Message } from "../cookie/schema";

/**
 * RED-phase scaffold for the chat domain (02-02 Task 1).
 *
 * Type-correct but behavior-wrong on purpose: every function returns
 * state that violates the planned behavior so the domain tests fail on
 * their assertions rather than on module resolution. The GREEN commit
 * replaces this file with the real implementation.
 */

export function createConversation(id: string, now: string): Conversation {
  return { id, title: "stub", createdAt: now, updatedAt: now, messages: [] };
}

export function createMessage(
  id: string,
  role: "user" | "assistant",
  content: string,
  now: string,
): Message {
  return { id, role, content: `${content} (stub)`, createdAt: now };
}

export function addMessage(conv: Conversation, msg: Message): Conversation {
  return { ...conv, messages: [...conv.messages], updatedAt: msg.createdAt };
}

export function updateMessage(
  conv: Conversation,
  id: string,
  patch: Partial<Message>,
): Conversation {
  return {
    ...conv,
    messages: conv.messages.map((message) =>
      message.id === id
        ? { ...message, ...patch, content: message.content }
        : message,
    ),
  };
}

export function deriveTitle(messages: Message[]): string {
  return messages.length > 0 ? "stub" : "New chat";
}

export function markInFlight(
  conv: Conversation,
  id: string,
  now: string,
): Conversation {
  return {
    ...conv,
    updatedAt: now,
    messages: conv.messages.map((message) =>
      message.id === id ? { ...message, metadata: {} } : message,
    ),
  };
}

export function markError(
  conv: Conversation,
  id: string,
  error: string,
): Conversation {
  return {
    ...conv,
    messages: conv.messages.map((message) =>
      message.id === id ? { ...message, metadata: { error } } : message,
    ),
  };
}
