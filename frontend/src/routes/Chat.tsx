import { useCallback, useEffect, useRef, useState } from "react";
import { Button, EmptyState, PageHeader } from "../components/ui";
import ChatComposer from "../components/chat/ChatComposer";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatThread from "../components/chat/ChatThread";
import StorageNotice from "../components/chat/StorageNotice";
import WaitingShell from "../components/chat/WaitingShell";
import { useAskController } from "../hooks/useAskController";
import { useConversations } from "../hooks/useConversations";
import { useElapsedClock } from "../hooks/useElapsedClock";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import {
  addMessage,
  createMessage,
  markError,
  markInFlight,
  updateMessage,
} from "../lib/chat/domain";
import type { Conversation, Message } from "../lib/cookie/schema";

/** C-02 — the exact meta description for this route. */
const META_DESCRIPTION = "Your trip planning chat";

/** A request waiting for the conversation it belongs to to exist. */
interface PendingSubmit {
  conversationId: string;
  messageId: string;
  question: string;
  threadId?: string;
}

/** Exactly one applied terminal status, keyed so nothing applies twice. */
interface AppliedRequest {
  conversationId: string;
  requestId: number;
}

export default function Chat() {
  // PERSIST-06/07/08: one hook owns the whole history — the list, the
  // active selection, the cookie persistence, and the auto-title. The
  // route below renders the active conversation and drives its requests.
  const {
    activeId,
    activeConversation,
    conversations,
    createConversation,
    deleteConversation,
    evictedIds,
    renameConversation,
    selectConversation,
    syncConversation,
  } = useConversations();

  const [showStorageNotice, setShowStorageNotice] = useState(false);
  /** The message owned by the live request; null whenever idle. */
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  /** Mobile drawer / desktop collapse state for the history sidebar. */
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      return window.matchMedia("(min-width: 768px)").matches;
    }
    return false;
  });

  // `stop` MUST be destructured from the hook: a bare `stop` identifier
  // resolves to the DOM global `window.stop()`, which aborts nothing
  // (code review CR-01 — D-32/WAIT-05 depend on this wiring).
  //
  // The controller is keyed on the active conversation id, so switching
  // conversations disposes the old controller: an in-flight request is
  // aborted and its late result can never reach React state (WAIT-06).
  const { status, submit, stop } = useAskController({
    conversationId: activeConversation?.id,
  });

  // C-01/C-02: the document title follows the active conversation title,
  // which is "New chat" before any conversation exists or before the
  // first user message derives one.
  useDocumentTitle(activeConversation?.title ?? "New chat", META_DESCRIPTION);

  // Mirrors so async handlers and the status effect always read the
  // freshest state without re-subscribing on every mutation.
  const activeConversationRef = useRef<Conversation | null>(activeConversation);
  const activeMessageIdRef = useRef<string | null>(activeMessageId);
  // Guards terminal-status application: exactly once per
  // (conversation, request) pair, even across controller re-inits.
  const appliedRequestRef = useRef<AppliedRequest | null>(null);
  // A first-ever submit defers its dispatch until the fresh controller
  // exists (see handleSubmit).
  const pendingSubmitRef = useRef<PendingSubmit | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    activeMessageIdRef.current = activeMessageId;
  }, [activeMessageId]);

  const busy = status.kind === "submitting" || status.kind === "waiting";
  const hasMessages =
    activeConversation !== null && activeConversation.messages.length > 0;
  // The clock is request-scoped (code review CR-02): it runs only while a
  // request is in flight, so the readout opens at 0:00 and band A no matter
  // how long the route was idle before the submit.
  const elapsed = useElapsedClock(busy);

  /**
   * Dispatch of a deferred first submit. The ask controller is keyed on
   * the conversation id, so the submit that CREATES the first conversation
   * must wait one commit for the fresh controller — dispatching against
   * the old one would have the request aborted by that very re-init.
   */
  useEffect(() => {
    const pending = pendingSubmitRef.current;
    if (pending === null) {
      return;
    }
    pendingSubmitRef.current = null;
    if (activeConversation?.id !== pending.conversationId) {
      // The conversation was switched away from (or deleted) before the
      // dispatch: dropping the request is the honest outcome.
      return;
    }
    submit(pending);
  }, [activeConversation, submit]);

  // PERSIST-05: the retention caps evicted the conversation on screen.
  // The notice never blocks or cancels anything.
  useEffect(() => {
    if (activeId !== null && evictedIds.includes(activeId)) {
      setShowStorageNotice(true);
    }
  }, [evictedIds, activeId]);

  const handleSubmit = useCallback(
    (text: string) => {
      // CHAT-08: a busy composer swallows the submission — including a
      // second Enter that lands before a deferred dispatch has run.
      if (busy || pendingSubmitRef.current !== null) {
        return;
      }
      const current = activeConversationRef.current;
      const now = new Date().toISOString();
      const messageId = crypto.randomUUID();

      // CHAT-03: the user's words appear immediately, before any response.
      // An empty history creates its first conversation right here; the
      // hook derives the title from this first user message (PERSIST-07).
      const conversation = current ?? createConversation();
      let next = addMessage(
        conversation,
        createMessage(messageId, "user", text, now),
      );
      next = markInFlight(next, messageId, now);

      syncConversation(next);
      activeMessageIdRef.current = messageId;
      setActiveMessageId(messageId);

      // D-35: `thread_id` rides along only when the conversation already
      // holds one from a prior successful turn. A first-turn send omits it.
      const request: PendingSubmit = {
        conversationId: next.id,
        messageId,
        question: text,
        ...(conversation.threadId === undefined
          ? {}
          : { threadId: conversation.threadId }),
      };
      if (current === null) {
        // First message of an empty history: the conversation is being
        // created in this very tick, which re-keys the ask controller.
        // Defer the dispatch one commit (effect above) instead of having
        // the re-init abort the request.
        pendingSubmitRef.current = request;
      } else {
        submit(request);
      }
    },
    [busy, createConversation, submit, syncConversation],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      if (busy) {
        return;
      }
      const current = activeConversationRef.current;
      if (current === null) {
        return;
      }
      const now = new Date().toISOString();

      // Re-arm the identical message. `updateMessage` replaces the metadata
      // outright, which drops the stale error key so the recovery block clears
      // while the retry is in flight; `updatedAt` advances so retention keeps
      // this conversation newest.
      const cleared = updateMessage(current, message.id, {
        metadata: { inFlight: true },
      });
      const next = { ...cleared, updatedAt: now };

      syncConversation(next);
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
    [busy, submit, syncConversation],
  );

  const handleCreateConversation = useCallback(() => {
    createConversation();
    // The in-flight marker belongs to the conversation being left behind;
    // it never travels into the fresh one.
    activeMessageIdRef.current = null;
    setActiveMessageId(null);
  }, [createConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      selectConversation(id);
      activeMessageIdRef.current = null;
      setActiveMessageId(null);
    },
    [selectConversation],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      // The hook moves the active selection when the deleted conversation
      // was the active one (PERSIST-06); the in-flight marker must not
      // follow the view to whatever becomes active next.
      deleteConversation(id);
      activeMessageIdRef.current = null;
      setActiveMessageId(null);
    },
    [deleteConversation],
  );

  // The mobile drawer trigger, kept as a ref so closing the drawer can
  // hand focus back to it.
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // Return focus to the header trigger so a keyboard user is never
    // stranded inside a drawer that just closed (a no-op on desktop,
    // where the trigger is display:none).
    hamburgerRef.current?.focus();
  }, []);

  /**
   * Terminal status application (CHAT-05, WAIT-05, PERSIST-09).
   *
   * Keyed on the (conversation, requestId) pair so a single transition is
   * applied exactly once, even if React re-runs the effect or a fresh
   * controller recycles request ids after a conversation switch. The
   * conversation and message ids are read from refs so the closure never
   * goes stale.
   */
  useEffect(() => {
    if (status.kind !== "succeeded" && status.kind !== "failed") {
      return;
    }
    if (
      appliedRequestRef.current !== null &&
      appliedRequestRef.current.conversationId === activeConversation?.id &&
      appliedRequestRef.current.requestId === status.requestId
    ) {
      return;
    }

    const current = activeConversationRef.current;
    const messageId = activeMessageIdRef.current;
    if (current === null || messageId === null) {
      return;
    }
    appliedRequestRef.current = {
      conversationId: current.id,
      requestId: status.requestId,
    };

    const now = new Date().toISOString();
    if (status.kind === "succeeded") {
      // CHAT-09: the answer exists only because the controller validated a
      // real backend response. Nothing here fabricates or transforms it.
      const answer = createMessage(
        crypto.randomUUID(),
        "assistant",
        status.answer,
        now,
      );
      let next = addMessage(current, answer);
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
      syncConversation(next);
    } else {
      // WAIT-05 / PERSIST-09: the customer-safe kind key is stored, and the
      // prompt plus all history stay untouched. `markError` clears the
      // in-flight flag, which is what surfaces the recovery block.
      syncConversation(markError(current, messageId, status.failure));
    }

    activeMessageIdRef.current = null;
    setActiveMessageId(null);
  }, [status, activeConversation, syncConversation]);

  return (
    <div className="mx-auto w-full max-w-container-xl px-md py-3xl">
      <div className="md:grid md:grid-cols-[auto_1fr] md:items-start md:gap-xl">
        {/* The main column comes first in DOM order so the route h1 leads
            the heading outline; CSS order puts the sidebar on its left
            from `md` up. */}
        <div className="min-w-0 md:order-2">
          <div className="flex items-center gap-sm">
            {/* QUAL-04: the drawer trigger lives in the header on small
                screens only; the desktop panel has its own collapse toggle. */}
            <Button
              ref={hamburgerRef}
              variant="ghost"
              size="sm"
              aria-label="Open chat history"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.75 4h10.5M2.75 8h10.5M2.75 12h10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                aria-label="Show chat history"
                onClick={() => setSidebarOpen(true)}
                className="hidden md:inline-flex"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="2.25"
                    y="2.25"
                    width="11.5"
                    height="11.5"
                    rx="1.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6.75 2.25v11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </Button>
            )}
            {/* C-03: the route h1 is the active conversation title — "New
                chat" until the first user message derives one from it. */}
            <PageHeader
              title={activeConversation?.title ?? "New chat"}
              className="min-w-0"
            />
          </div>

          {hasMessages ? (
            <ChatThread
              messages={activeConversation.messages}
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

          {/* GAME-01: the waiting shell shows only while a request is in
              flight, and its 2048 board mounts only once the request is
              actively waiting — never during the brief submitting phase,
              never after a terminal status unmounts the shell. */}
          {busy ? (
            <WaitingShell
              elapsedMs={elapsed}
              onStop={stop}
              isWaiting={status.kind === "waiting"}
            />
          ) : null}

          {showStorageNotice ? <StorageNotice /> : null}

          {/* D-33: page-level scroll with a sticky composer — never a nested
              scroll container. */}
          <div className="sticky bottom-0 border-t border-line bg-canvas pb-xl pt-md">
            <ChatComposer onSubmit={handleSubmit} busy={busy} />
          </div>
        </div>

        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          onCreateConversation={handleCreateConversation}
          onSelectConversation={handleSelectConversation}
          onRenameConversation={renameConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>
    </div>
  );
}
