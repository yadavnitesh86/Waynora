import { useCallback, useEffect, useRef, useState } from "react";
import { useAskController } from "../hooks/useAskController";
import { useElapsedClock } from "../hooks/useElapsedClock";
import {
  readConversations,
  writeConversations,
} from "../lib/cookie/repository";
import {
  addMessage,
  createConversation,
  createMessage,
  deriveTitle,
  markError,
  markInFlight,
  updateMessage,
} from "../lib/chat/domain";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import type { Conversation, Message } from "../lib/cookie/schema";
import { EmptyState, PageHeader } from "../components/ui";
import ChatComposer from "../components/chat/ChatComposer";
import ChatThread from "../components/chat/ChatThread";
import StorageNotice from "../components/chat/StorageNotice";
import WaitingShell from "../components/chat/WaitingShell";

/** C-02 — the exact meta description for this route. */
const META_DESCRIPTION = "Your trip planning chat";

/**
 * Newest-first is already the Phase 2 retention order, so the active
 * conversation is `conversations[0]` and no re-sort happens. An empty
 * snapshot gets a fresh conversation: Phase 3 renders exactly one
 * conversation, and the explicit "New chat" control is Phase 4 (PERSIST-06).
 */
function loadConversation(): Conversation {
  const result = readConversations();
  const first = result.conversations[0];
  if (first) {
    return first;
  }
  return createConversation(
    crypto.randomUUID(),
    new Date().toISOString(),
  );
}

export default function Chat() {
  const [conversation, setConversation] = useState<Conversation>(loadConversation);
  const [showStorageNotice, setShowStorageNotice] = useState(false);
  /** The message owned by the live request; null whenever idle. */
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // `stop` MUST be destructured from the hook: a bare `stop` identifier
  // resolves to the DOM global `window.stop()`, which aborts nothing
  // (code review CR-01 — D-32/WAIT-05 depend on this wiring).
  const { status, submit, stop } = useAskController({
    conversationId: conversation.id,
  });

  // C-01/C-02: the document title follows the conversation title, which is
  // "New chat" before the first user message and the derived title after it.
  useDocumentTitle(conversation.title, META_DESCRIPTION);

  // Mirrors so async handlers and the status effect always read the freshest
  // state without re-subscribing on every mutation.
  const conversationRef = useRef(conversation);
  const activeMessageIdRef = useRef<string | null>(activeMessageId);
  // Guards terminal-status application: exactly once per requestId.
  const appliedRequestIdRef = useRef(0);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    activeMessageIdRef.current = activeMessageId;
  }, [activeMessageId]);

  const busy = status.kind === "submitting" || status.kind === "waiting";
  const hasMessages = conversation.messages.length > 0;
  // The clock is request-scoped (code review CR-02): it runs only while a
  // request is in flight, so the readout opens at 0:00 and band A no matter
  // how long the route was idle before the submit.
  const elapsed = useElapsedClock(busy);

  /** Persists and surfaces PERSIST-05 without ever blocking the request. */
  function persist(next: Conversation) {
    const result = writeConversations([next]);
    if (result.evicted.includes(next.id)) {
      setShowStorageNotice(true);
    }
  }

  /** Applies a new conversation to state, the ref, and the cookie store. */
  function commit(next: Conversation) {
    conversationRef.current = next;
    setConversation(next);
    persist(next);
  }

  const handleSubmit = useCallback(
    (text: string) => {
      // CHAT-08: a busy composer swallows the submission.
      if (busy) {
        return;
      }
      const current = conversationRef.current;
      const now = new Date().toISOString();
      const messageId = crypto.randomUUID();

      // CHAT-03: the user's words appear immediately, before any response.
      let next = addMessage(
        current,
        createMessage(messageId, "user", text, now),
      );
      next = markInFlight(next, messageId, now);
      // D-26: the title derives from the FIRST user message only, so a second
      // turn must not retitle the conversation.
      const hadUserMessage = current.messages.some((m) => m.role === "user");
      if (!hadUserMessage) {
        next = { ...next, title: deriveTitle(next.messages) };
      }

      commit(next);
      activeMessageIdRef.current = messageId;
      setActiveMessageId(messageId);

      // D-35: `thread_id` rides along only when the conversation already holds
      // one from a prior successful turn. A first-turn send omits it.
      submit({
        conversationId: next.id,
        messageId,
        question: text,
        ...(current.threadId === undefined
          ? {}
          : { threadId: current.threadId }),
      });
    },
    [busy, submit],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      if (busy) {
        return;
      }
      const current = conversationRef.current;
      const now = new Date().toISOString();

      // Re-arm the identical message. `updateMessage` replaces the metadata
      // outright, which drops the stale error key so the recovery block clears
      // while the retry is in flight; `updatedAt` advances so retention keeps
      // this conversation newest.
      const cleared = updateMessage(current, message.id, {
        metadata: { inFlight: true },
      });
      const next = { ...cleared, updatedAt: now };

      commit(next);
      activeMessageIdRef.current = message.id;
      setActiveMessageId(message.id);

      // Retry re-sends the identical question; thread_id only when known (D-35).
      submit({
        conversationId: next.id,
        messageId: message.id,
        question: message.content,
        ...(current.threadId === undefined
          ? {}
          : { threadId: current.threadId }),
      });
    },
    [busy, submit],
  );

  /**
   * Terminal status application (CHAT-05, WAIT-05, PERSIST-09).
   *
   * Keyed on `requestId` so a single transition is applied exactly once, even
   * if React re-runs the effect. The message id is read from the ref so the
   * closure never goes stale.
   */
  useEffect(() => {
    if (status.kind !== "succeeded" && status.kind !== "failed") {
      return;
    }
    if (appliedRequestIdRef.current === status.requestId) {
      return;
    }
    appliedRequestIdRef.current = status.requestId;

    const messageId = activeMessageIdRef.current;
    if (messageId === null) {
      return;
    }

    const now = new Date().toISOString();
    if (status.kind === "succeeded") {
      // CHAT-09: the answer exists only because the controller validated a real
      // backend response. Nothing here fabricates or transforms it.
      const answer = createMessage(
        crypto.randomUUID(),
        "assistant",
        status.answer,
        now,
      );
      let next = addMessage(conversationRef.current, answer);
      // CHAT-05: store the returned thread_id on the conversation.
      next = { ...next, threadId: status.threadId };
      // D-27: the in-flight flag clears now that a real answer exists.
      next = {
        ...next,
        messages: next.messages.map((m) =>
          m.id === messageId
            ? { ...m, metadata: { ...m.metadata, inFlight: false } }
            : m,
        ),
      };
      commit(next);
    } else {
      // WAIT-05 / PERSIST-09: the customer-safe kind key is stored, and the
      // prompt plus all history stay untouched. `markError` clears the
      // in-flight flag, which is what surfaces the recovery block.
      commit(markError(conversationRef.current, messageId, status.failure));
    }

    activeMessageIdRef.current = null;
    setActiveMessageId(null);
  }, [status]);

  return (
    <div className="mx-auto w-full max-w-container-lg px-md py-3xl">
      {/* C-03: the route h1 is the conversation title — "New chat" until the
          first user message derives one from it. */}
      <PageHeader title={conversation.title} />

      {hasMessages ? (
        <ChatThread
          messages={conversation.messages}
          activeMessageId={activeMessageId}
          onRetry={handleRetry}
        />
      ) : (
        <div className="mb-lg">
          <EmptyState
            title="Where do you want to go?"
            body="Describe your trip in your own words. A real agent builds the plan, usually in 5 to 15 minutes. Your chat stays in this browser."
          />
        </div>
      )}

      {busy ? (
        <WaitingShell elapsedMs={elapsed} onStop={stop} />
      ) : null}

      {showStorageNotice ? <StorageNotice /> : null}

      {/* D-33: page-level scroll with a sticky composer — never a nested
          scroll container. */}
      <div className="sticky bottom-0 border-t border-line bg-canvas pb-xl pt-md">
        <ChatComposer onSubmit={handleSubmit} busy={busy} />
      </div>
    </div>
  );
}
