import { useCallback, useMemo, useRef, useState } from "react";
import { readConversations, writeConversations } from "../lib/cookie/repository";
import type { Conversation } from "../lib/cookie/schema";
import {
  createConversation as createEmptyConversation,
  deriveTitle,
} from "../lib/chat/domain";

/**
 * Multi-conversation state manager (PERSIST-06, PERSIST-07, PERSIST-08).
 *
 * The single owner of conversation history: it loads the snapshot from the
 * cookie repository once on mount, keeps the in-memory list sorted newest
 * first (the Phase 2 retention order, D-20), and writes the whole list back
 * through the repository on every mutation. The hook owns no UI and no
 * request state — `src/routes/Chat.tsx` composes it with `useAskController`.
 *
 * Two guarantees the chat route leans on:
 *
 * - Mutations compose synchronously: two calls inside one event handler (for
 *   example "create the first conversation, then add its first message")
 *   both see each other's result, because each mutator advances a ref before
 *   scheduling state — the same mirror pattern the route uses for its
 *   conversation ref.
 * - Nothing is persisted unless a mutator ran: an empty snapshot on first
 *   visit stays empty in the cookie store, so revisiting the page never
 *   accumulates empty "New chat" junk (PERSIST-08).
 */

/** The default title every brand-new conversation carries (D-24, D-26). */
const UNTITLED_TITLE = "New chat";

interface ConversationsState {
  /** Every known conversation, sorted newest first (retention order). */
  conversations: Conversation[];
  /** The selected conversation's id, or null when no chat is selected. */
  activeId: string | null;
}

/** Newest-first by `updatedAt` — the order reads and writes already share. */
function byNewestFirst(a: Conversation, b: Conversation): number {
  if (a.updatedAt === b.updatedAt) {
    // ISO strings with the same instant compare equal; a stable sort keeps
    // the incoming order for ties (same-millisecond creations).
    return 0;
  }
  return a.updatedAt < b.updatedAt ? 1 : -1;
}

/**
 * Loads the snapshot and selects the newest conversation (the 04-CONTEXT
 * fallback). `readConversations` is total — a malformed snapshot yields an
 * empty result rather than a throw (D-21) — so this needs no error path.
 */
function loadInitialState(): ConversationsState {
  const result = readConversations();
  const conversations = [...result.conversations].sort(byNewestFirst);
  return { conversations, activeId: conversations[0]?.id ?? null };
}

export interface UseConversations {
  /** All conversations, newest first. */
  conversations: Conversation[];
  /** The active conversation's id, or null when the list is empty. */
  activeId: string | null;
  /** The active conversation, or null when the list is empty. */
  activeConversation: Conversation | null;
  /**
   * Creates an empty "New chat", activates it, and persists the list.
   * Returns the fresh conversation so a caller can immediately add a
   * message to it in the same handler.
   */
  createConversation: () => Conversation;
  /** Activates an existing conversation. Unknown ids are ignored. */
  selectConversation: (id: string) => void;
  /**
   * Renames a conversation. A blank title is rejected (the existing title
   * survives), and unknown ids are ignored. A rename counts as a touch:
   * `updatedAt` advances so retention treats the edited conversation as the
   * most recently used one (D-20).
   */
  renameConversation: (id: string, newTitle: string) => void;
  /**
   * Deletes a conversation and persists the list. Deleting the active
   * conversation activates the next most recent survivor, or clears the
   * selection entirely when nothing is left (PERSIST-06). Unknown ids are
   * ignored.
   */
  deleteConversation: (id: string) => void;
  /**
   * Replaces a conversation's stored state (messages, title, threadId) and
   * persists the list. Derives the auto-title from the first user message
   * while the title is still the untouched default (PERSIST-07, D-26) —
   * an explicit rename is never overwritten. Unknown ids are ignored, so a
   * late sync can never resurrect a deleted conversation.
   */
  syncConversation: (updated: Conversation) => void;
  /**
   * Conversation ids the retention caps evicted on the most recent write
   * (D-20). Empty after a write that evicted nothing.
   */
  evictedIds: string[];
}

export function useConversations(): UseConversations {
  const [state, setState] = useState<ConversationsState>(loadInitialState);
  const [evictedIds, setEvictedIds] = useState<string[]>([]);

  // Mirror advanced synchronously by every mutator, so back-to-back
  // mutations in one event handler compose without waiting for a render.
  const latestRef = useRef(state);

  /** Applies new state, persists it, and returns nothing (mutators return
   *  their own domain results instead). */
  const commit = useCallback((next: ConversationsState) => {
    latestRef.current = next;
    setState(next);
    const result = writeConversations(next.conversations);
    setEvictedIds(result.evicted);
  }, []);

  const createConversation = useCallback((): Conversation => {
    const now = new Date().toISOString();
    const fresh = createEmptyConversation(crypto.randomUUID(), now);
    const prev = latestRef.current;
    commit({
      // Newest first: a brand-new chat belongs at the top of the list.
      conversations: [fresh, ...prev.conversations],
      activeId: fresh.id,
    });
    return fresh;
  }, [commit]);

  const selectConversation = useCallback((id: string) => {
    const prev = latestRef.current;
    if (prev.activeId === id) {
      return;
    }
    if (!prev.conversations.some((conversation) => conversation.id === id)) {
      return;
    }
    // Selection is UI state, not conversation data: no cookie write.
    latestRef.current = { ...prev, activeId: id };
    setState(latestRef.current);
  }, []);

  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      const title = newTitle.trim();
      if (title.length === 0) {
        // A blank rename is a validation failure at the input; the hook
        // keeps the existing title rather than persisting an empty one
        // (the cookie schema requires a non-empty title).
        return;
      }
      const prev = latestRef.current;
      const target = prev.conversations.find(
        (conversation) => conversation.id === id,
      );
      if (target === undefined || target.title === title) {
        return;
      }
      const now = new Date().toISOString();
      const conversations = prev.conversations
        .map((conversation) =>
          conversation.id === id
            ? { ...conversation, title, updatedAt: now }
            : conversation,
        )
        .sort(byNewestFirst);
      commit({ conversations, activeId: prev.activeId });
    },
    [commit],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      const prev = latestRef.current;
      if (!prev.conversations.some((conversation) => conversation.id === id)) {
        return;
      }
      const conversations = prev.conversations.filter(
        (conversation) => conversation.id !== id,
      );
      // Only the active selection needs a new home; every other
      // conversation's active id is untouched by this deletion.
      const activeId =
        prev.activeId === id ? (conversations[0]?.id ?? null) : prev.activeId;
      commit({ conversations, activeId });
    },
    [commit],
  );

  const syncConversation = useCallback(
    (updated: Conversation) => {
      const prev = latestRef.current;
      const current = prev.conversations.find(
        (conversation) => conversation.id === updated.id,
      );
      if (current === undefined) {
        // Unknown conversation: dropping the sync is the safe direction —
        // appending would resurrect deleted chats from a late write.
        return;
      }
      const hadUserMessage = current.messages.some(
        (message) => message.role === "user",
      );
      const titled =
        !hadUserMessage &&
        current.title === UNTITLED_TITLE &&
        updated.messages.some((message) => message.role === "user")
          ? // PERSIST-07: the first user message titles the chat, once.
            { ...updated, title: deriveTitle(updated.messages) }
          : updated;
      const conversations = prev.conversations
        .map((conversation) =>
          conversation.id === updated.id ? titled : conversation,
        )
        .sort(byNewestFirst);
      commit({ conversations, activeId: prev.activeId });
    },
    [commit],
  );

  const activeConversation = useMemo(
    () =>
      state.conversations.find(
        (conversation) => conversation.id === state.activeId,
      ) ?? null,
    [state.conversations, state.activeId],
  );

  return useMemo(
    () => ({
      conversations: state.conversations,
      activeId: state.activeId,
      activeConversation,
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      syncConversation,
      evictedIds,
    }),
    [
      state.conversations,
      state.activeId,
      activeConversation,
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      syncConversation,
      evictedIds,
    ],
  );
}

export default useConversations;
