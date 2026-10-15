import { useState, useRef, useCallback } from "react";
import TextArea from "../ui/TextArea";

export interface ChatComposerProps {
  onSubmit: (text: string) => void;
  busy?: boolean;
}

export default function ChatComposer({ onSubmit, busy }: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && !busy) {
      onSubmit(trimmed);
      setDraft("");
      textareaRef.current?.focus();
    }
  }, [draft, busy, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const canSubmit = !busy && draft.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      aria-busy={busy || undefined}
    >
      {busy && (
        <div
          role="status"
          className="mb-md rounded-md bg-info-subtle px-md py-sm text-sm text-info"
        >
          A request is already running. Your text stays here until it finishes.
        </div>
      )}
      <TextArea
        ref={textareaRef}
        label="Your trip request"
        placeholder="Example: 10 days in Japan in April, two people, mid-range budget."
        hint="Press Enter to send. Shift+Enter starts a new line."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="mt-sm flex items-center justify-between">
        <p className="text-caption text-ink-muted">
          Press <kbd className="font-mono rounded bg-line/60 px-1 py-0.5 text-[0.75rem]">Enter</kbd> to send, <kbd className="font-mono rounded bg-line/60 px-1 py-0.5 text-[0.75rem]">Shift+Enter</kbd> for new line
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Send request"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-ink shadow-xs transition-all duration-150 hover:shadow-sm hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-focus"
        >
          <span className="sr-only">Send request</span>
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
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
