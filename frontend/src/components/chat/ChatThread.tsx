import { memo } from "react";
import type { Message } from "../../lib/cookie/schema";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

export interface ChatThreadProps {
  messages: Message[];
  /** The message owned by the active request, or null when idle. */
  activeMessageId: string | null;
  onRetry: (message: Message) => void;
}

/**
 * The transcript (CHAT-07): `<ol aria-label="Conversation">` with every turn
 * as an `<li>` in DOM order, oldest first.
 *
 * The list deliberately carries NO live region — no `aria-live`, no
 * `role="log"`. Nesting one here would announce every itinerary twice, since
 * the assistant `Markdown` wrapper already owns its own `aria-live="polite"`.
 * That is the double-announcement rule, and it is binding.
 *
 * Memoized so the per-second elapsed tick (03-03) re-renders only the waiting
 * shell and the in-flight footer, never the transcript or `Markdown`.
 */
function ChatThread({
  messages,
  activeMessageId,
  onRetry,
}: ChatThreadProps) {
  return (
    <ol aria-label="Conversation" className="mb-lg">
      {messages.map((message) =>
        message.role === "user" ? (
          <li key={message.id} className="mb-lg">
            <UserMessage
              message={message}
              isActive={message.id === activeMessageId}
              onRetry={onRetry}
            />
          </li>
        ) : (
          <li key={message.id} className="mb-lg">
            <AssistantMessage message={message} />
          </li>
        ),
      )}
    </ol>
  );
}

export default memo(ChatThread);
