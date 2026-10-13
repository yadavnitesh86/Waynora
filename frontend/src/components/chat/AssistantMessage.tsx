import { memo } from "react";
import type { Message } from "../../lib/cookie/schema";
import { Markdown } from "../Markdown";

export interface AssistantMessageProps {
  message: Message;
}

/**
 * Assistant turn (CHAT-06, CHAT-07, D-30): a `Waynora` caption, a hairline
 * rule, and the answer flat on the canvas — no card, no border, no shadow.
 *
 * The answer renders through the UNCHANGED `Markdown` component. It is not
 * wrapped, restyled, or replaced: that component is what makes raw HTML and
 * unsafe URL schemes inert, so anything that alters its inputs or its
 * renderer would silently reopen T-03-07 (CHAT-06, QUAL-03).
 */
function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="border-t border-line pt-md">
      <p className="mb-2xs text-caption text-ink-muted">Waynora</p>
      <Markdown content={message.content} />
    </div>
  );
}

export default memo(AssistantMessage);
