import { useState } from "react";

export interface ChatComposerProps {
  onSubmit: (text: string) => void;
  busy?: boolean;
}

export default function ChatComposer({ onSubmit, busy }: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button type="submit" disabled>
        Send request
      </button>
    </form>
  );
}
