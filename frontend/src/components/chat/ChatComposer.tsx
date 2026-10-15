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
    <div className="w-full rounded-2xl border border-gold/30 bg-surface/95 p-2 sm:p-2.5 shadow-card backdrop-blur-md transition-all focus-within:border-gold/60 focus-within:shadow-luxury">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        aria-busy={busy || undefined}
        className="flex flex-col"
      >
        {busy && (
          <div
            role="status"
            className="mb-1.5 flex items-center gap-2 rounded-lg border border-accent/25 bg-accent-soft/80 px-2.5 py-1 text-caption text-accent"
          >
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            A request is already running. Your text stays here until it finishes.
          </div>
        )}

        <TextArea
          ref={textareaRef}
          compact
          label="Your trip request"
          placeholder="Example: 10 days in Japan in April, two people, mid-range budget."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-body transition-all"
        />

        <div className="mt-1 flex items-center justify-between gap-2 pt-1 border-t border-line/30">
          <p className="text-[11px] text-ink-muted/80 truncate">
            Press Enter to send. Shift+Enter starts a new line.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Send request"
            className="group inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-accent text-accent-ink shadow-2xs transition-all duration-200 hover:scale-105 hover:shadow-luxury active:scale-95 disabled:opacity-35 disabled:hover:scale-100 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span className="sr-only">Send request</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
