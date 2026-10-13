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
      <button type="submit" disabled={!canSubmit} className="mt-sm">
        Send request
      </button>
    </form>
  );
}
