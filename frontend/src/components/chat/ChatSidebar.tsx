import { useEffect, useRef, useState } from "react";
import type { Conversation } from "../../lib/cookie/schema";
import { Button } from "../ui";
import ConversationItem from "./ConversationItem";

export interface ChatSidebarProps {
  /** Every conversation, newest first. */
  conversations: Conversation[];
  /** The active conversation's id, or null when the list is empty. */
  activeId: string | null;
  /**
   * Drawer/collapse state. On mobile the sidebar is an overlay drawer
   * while open and off-screen while closed; on desktop it is a persistent
   * panel while open and collapsed away while closed. The route owns this
   * state so its header hamburger can open the drawer.
   */
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
}

/**
 * True when the viewport is the desktop breakpoint (`md`, 768px). jsdom
 * and SSR-safe: without `matchMedia` this reads as mobile, where the
 * extra close-on-navigate behaviour is always safe.
 */
function isDesktopViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 768px)").matches
  );
}

/**
 * The chat history sidebar (PERSIST-06, QUAL-04).
 *
 * Responsive behaviour in one component: below `md` it is a drawer that
 * slides over the thread (scrim, Escape to close, focus moved inside on
 * open) and closes itself after any navigation; at `md` and above it is a
 * persistent panel with a collapse toggle. Both modes share the same
 * `isOpen` state and the same controls.
 *
 * Rename and delete-confirm state live here, not in each item, so
 * switching selection cancels a stranded edit.
 */
export default function ChatSidebar({
  conversations,
  activeId,
  isOpen,
  onClose,
  onCreateConversation,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Escape closes the drawer — but only when no inline edit owns the
  // keyboard, so canceling a rename never closes the sidebar behind it.
  useEffect(() => {
    if (!isOpen || editingId !== null || confirmDeleteId !== null) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, editingId, confirmDeleteId, onClose]);

  // Focus the landmark on open so screen readers announce the history
  // region and the next Tab lands on the New chat action.
  useEffect(() => {
    if (isOpen) {
      navRef.current?.focus();
    }
  }, [isOpen]);

  function handleSelect(id: string) {
    setEditingId(null);
    setConfirmDeleteId(null);
    onSelectConversation(id);
    // On mobile the drawer covers the thread; navigating closes it. On
    // desktop the persistent panel stays put.
    if (!isDesktopViewport()) {
      onClose();
    }
  }

  function handleCreate() {
    setEditingId(null);
    setConfirmDeleteId(null);
    onCreateConversation();
    if (!isDesktopViewport()) {
      onClose();
    }
  }

  function handleRename(id: string, title: string) {
    setEditingId(null);
    onRenameConversation(id, title);
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(null);
    onDeleteConversation(id);
  }

  return (
    <>
      {/* Scrim: mobile only, decorative — the drawer itself carries the
          controls and the Escape handler. */}
      {isOpen ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-ink/40 md:hidden"
        />
      ) : null}
      <nav
        ref={navRef}
        tabIndex={-1}
        aria-label="Chat history"
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-line bg-surface",
          // QUAL-04: the drawer slide is transform-only at the locked 200ms
          // ease-out; motion-reduce plus the global override in globals.css
          // collapse it to an instant state change.
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          "md:static md:z-auto md:shrink-0",
          isOpen
            ? "visible translate-x-0"
            : "invisible -translate-x-full md:hidden",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-sm border-b border-line px-md py-sm">
          <p className="text-overline font-semibold uppercase tracking-[0.14em] text-accent">
            Your chats
          </p>
          <div className="flex items-center gap-2xs">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Close chat history"
              onClick={onClose}
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
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Hide chat history"
              aria-expanded={isOpen}
              onClick={onClose}
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
          </div>
        </div>

        <div className="px-md py-sm">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleCreate}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            New chat
          </Button>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-md py-xl text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent mb-sm">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <p className="text-small font-semibold text-ink">No chats yet</p>
            <p className="mt-xs text-caption leading-[1.5] text-ink-muted">
              Start a new chat and your trip conversations will appear here.
            </p>
          </div>
        ) : (
          <ul
            aria-label="Saved chats"
            className="flex-1 overflow-y-auto pb-lg"
          >
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                isRenaming={editingId === conversation.id}
                isConfirmingDelete={confirmDeleteId === conversation.id}
                onSelect={handleSelect}
                onStartRename={setEditingId}
                onRename={handleRename}
                onCancelRename={() => setEditingId(null)}
                onStartDelete={setConfirmDeleteId}
                onDelete={handleDelete}
                onCancelDelete={() => setConfirmDeleteId(null)}
              />
            ))}
          </ul>
        )}
      </nav>
    </>
  );
}
