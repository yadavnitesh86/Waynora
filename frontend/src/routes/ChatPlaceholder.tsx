import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function ChatPlaceholder() {
  useDocumentTitle("Chat", "Your trip planning chat");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-md">
      <div className="max-w-prose text-center">
        <h1 className="font-display text-h1 font-semibold text-ink mb-md">
          Your trip goes here
        </h1>
        <p className="text-lead text-ink-muted leading-[1.55] mb-lg">
          Chat and your generated travel plans arrive in Phase 3. Nothing to show yet.
        </p>
        <button
          type="button"
          className="min-h-[44px] px-lg py-sm border border-line text-ink font-semibold rounded-md hover:bg-surface transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
