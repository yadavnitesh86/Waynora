import { useState, useRef, useCallback, useEffect } from "react";
import TextArea from "../ui/TextArea";
import Button from "../ui/Button";

/** Static id for the composer hint, wired to the textarea via aria-describedby. */
const HINT_ID = "chat-composer-hint";

export interface ChatComposerProps {
  onSubmit: (text: string) => void;
  busy?: boolean;
  /**
   * Controlled draft. Pass both `draft` and `onDraftChange` to let a parent
   * prefill the composer (the empty state's starter prompts do exactly that);
   * omit both and the composer keeps its own local draft as before.
   */
  draft?: string;
  onDraftChange?: (value: string) => void;
  /** Increment to move focus into the textarea (used after a prefill). */
  focusToken?: number;
}

/** Arrow glyph for the send control. */
function SendGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function ChatComposer({
  onSubmit,
  busy,
  draft,
  onDraftChange,
  focusToken,
}: ChatComposerProps) {
  // Uncontrolled by default: every existing caller keeps working untouched.
  const [localDraft, setLocalDraft] = useState("");
  const isControlled = draft !== undefined && onDraftChange !== undefined;
  const value = isControlled ? draft : localDraft;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusTokenRef = useRef(focusToken ?? 0);

  const setValue = useCallback(
    (next: string) => {
      if (onDraftChange !== undefined) {
        onDraftChange(next);
      } else {
        setLocalDraft(next);
      }
    },
    [onDraftChange],
  );

  // A prefill from the empty state should land the caret in the field, not
  // just fill an invisible box.
  useEffect(() => {
    if (focusToken === undefined || focusToken === lastFocusTokenRef.current) {
      return;
    }
    lastFocusTokenRef.current = focusToken;
    textareaRef.current?.focus();
  }, [focusToken]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length > 0 && !busy) {
      onSubmit(trimmed);
      setValue("");
      textareaRef.current?.focus();
    }
  }, [value, busy, onSubmit, setValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const canSubmit = !busy && value.trim().length > 0;

  return (
    <div className="w-full rounded-2xl border border-line bg-surface-raised/95 p-sm shadow-sm transition-colors duration-200 focus-within:border-gold/60">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        aria-busy={busy || undefined}
        className="flex flex-col"
      >
        {busy ? (
          <div
            role="status"
            className="mb-xs flex items-center gap-xs rounded-lg border border-accent/25 bg-accent-soft/80 px-sm py-xs text-caption text-accent"
          >
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            A request is already running. Your text stays here until it
            finishes.
          </div>
        ) : null}

        <TextArea
          ref={textareaRef}
          compact
          label="Your trip request"
          placeholder="Example: 10 days in Japan in April, two people, mid-range budget."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-describedby={HINT_ID}
          className="text-body"
        />

        <div className="mt-xs flex items-center justify-between gap-sm border-t border-line/60 pt-xs">
          <p id={HINT_ID} className="text-caption text-ink-muted">
            Press Enter to send. Shift+Enter starts a new line.
          </p>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            aria-label="Send request"
            className="group w-11 shrink-0 rounded-full p-0"
          >
            <SendGlyph />
          </Button>
        </div>
      </form>
    </div>
  );
}
