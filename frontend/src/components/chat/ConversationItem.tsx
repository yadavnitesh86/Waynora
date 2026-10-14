import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { Conversation } from "../../lib/cookie/schema";
import { Button, TextField } from "../ui";

/**
 * Longest title the rename input accepts. Matches the 50-character slice
 * `deriveTitle` uses for auto titles (D-26), so user titles and derived
 * titles stay the same size in the list.
 */
export const MAX_TITLE_LENGTH = 50;

/**
 * Formats a conversation timestamp for the list, in UTC — every timestamp
 * in the app is stored as `new Date().toISOString()` (Z offset), so
 * formatting in UTC keeps the rendering identical on every machine.
 * Today's chats read as a clock time, older ones as a calendar date.
 */
export function formatTimestamp(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const sameDay =
    date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export interface ConversationItemProps {
  conversation: Conversation;
  /** The conversation currently shown in the thread. */
  isActive: boolean;
  /** True while this item's title is being edited (owned by the sidebar). */
  isRenaming: boolean;
  /** True while this item's delete is awaiting confirmation. */
  isConfirmingDelete: boolean;
  onSelect: (id: string) => void;
  onStartRename: (id: string) => void;
  /** Saves the trimmed title; also exits rename mode. */
  onRename: (id: string, title: string) => void;
  onCancelRename: () => void;
  onStartDelete: (id: string) => void;
  onDelete: (id: string) => void;
  onCancelDelete: () => void;
}

/**
 * One conversation in the history sidebar (PERSIST-06).
 *
 * Three states in one row: browsing (select / rename / delete actions),
 * renaming (inline `TextField` with Enter-to-save, Escape-to-cancel, and
 * blank rejection), and delete confirmation (inline, with focus moved to
 * the destructive action so a keyboard user never loses their place).
 * Rename and confirm state live in `ChatSidebar` so selecting another
 * conversation cancels an edit instead of leaving it stranded.
 */
export default function ConversationItem({
  conversation,
  isActive,
  isRenaming,
  isConfirmingDelete,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onStartDelete,
  onDelete,
  onCancelDelete,
}: ConversationItemProps) {
  const [draft, setDraft] = useState(conversation.title);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Entering rename mode always starts from the stored title, never from
  // a previous edit attempt.
  useEffect(() => {
    if (isRenaming) {
      setDraft(conversation.title);
      setError(null);
    }
  }, [isRenaming, conversation.title]);

  // Focus lands inside the edit affordance, selected, so typing replaces
  // the whole title.
  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  // The destructive confirm button takes focus so Enter/Escape have an
  // unambiguous home and screen readers announce the question first.
  useEffect(() => {
    if (isConfirmingDelete) {
      confirmRef.current?.focus();
    }
  }, [isConfirmingDelete]);

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (title.length === 0) {
      // Validation failure keeps the user in edit mode with the reason.
      setError("Enter a title for this chat.");
      return;
    }
    onRename(conversation.id, title);
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelRename();
    }
  }

  function handleConfirmKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelDelete();
    }
  }

  if (isRenaming) {
    return (
      <li className="px-2xs py-3xs">
        <form onSubmit={handleRenameSubmit}>
          <TextField
            ref={inputRef}
            label="Chat title"
            value={draft}
            maxLength={MAX_TITLE_LENGTH}
            hint="Enter saves. Escape cancels."
            error={error ?? undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={handleRenameKeyDown}
          />
        </form>
      </li>
    );
  }

  if (isConfirmingDelete) {
    return (
      <li className="px-2xs py-3xs">
        <div
          role="group"
          aria-label={`Delete ${conversation.title}`}
          onKeyDown={handleConfirmKeyDown}
          className="rounded-md border border-line bg-surface-raised px-sm py-sm"
        >
          <p className="text-small font-medium text-ink">
            Delete this chat? This can&apos;t be undone.
          </p>
          <div className="mt-sm flex items-center gap-sm">
            <Button
              ref={confirmRef}
              variant="secondary"
              size="sm"
              className="text-danger"
              onClick={() => onDelete(conversation.id)}
            >
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelDelete}>
              Keep
            </Button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="px-2xs py-3xs">
      <div
        className={[
          "flex items-center gap-2xs rounded-md border px-2xs",
          isActive
            ? "border-accent bg-accent-soft"
            : "border-transparent hover:bg-surface-raised",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => onSelect(conversation.id)}
          aria-current={isActive ? "true" : undefined}
          className="min-w-0 flex-1 rounded-sm px-sm py-sm text-left"
        >
          <span className="block truncate text-small font-medium text-ink">
            {conversation.title}
          </span>
          <span className="mt-3xs block text-caption text-ink-muted">
            {formatTimestamp(conversation.updatedAt)}
          </span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Rename ${conversation.title}`}
          onClick={() => onStartRename(conversation.id)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10.8 2.7l2.5 2.5-7.3 7.3-3.3.8.8-3.3 7.3-7.3z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete ${conversation.title}`}
          onClick={() => onStartDelete(conversation.id)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.75 4.25h10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M11.5 4.25V2.75a1 1 0 0 0-1-1h-3.5a1 1 0 0 0-1 1v1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M4.25 4.25l.5 9h6.5l.5-9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M6.75 6.75v4.5M9.25 6.75v4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </div>
    </li>
  );
}
