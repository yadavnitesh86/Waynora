import { memo } from "react";
import type { Message } from "../../lib/cookie/schema";
import { Markdown } from "../Markdown";

export interface AssistantMessageProps {
  message: Message;
}

/**
 * Assistant turn (CHAT-06, CHAT-07, D-30).
 *
 * Deliberately flat: a monogram, a name, and the answer on the canvas. The
 * user turn is the only raised card in the transcript, which is what makes
 * it obvious whose words are whose without a border around every answer.
 *
 * The answer renders through the UNCHANGED `Markdown` component. It is not
 * wrapped, restyled, or replaced: that component makes raw HTML and
 * unsafe URL schemes inert, preserving security contracts (CHAT-06, QUAL-03).
 */
function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <article className="flex min-w-0 flex-col">
      <div className="mb-xs flex items-center gap-xs">
        <div
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-surface text-accent shadow-2xs"
        >
          <span className="font-display text-caption font-bold leading-none">
            W
          </span>
        </div>
        <span className="font-display text-small font-semibold tracking-tight text-ink">
          Waynora
        </span>
      </div>

      <div className="max-w-[88ch] text-ink">
        <Markdown content={message.content} />
      </div>
    </article>
  );
}

export default memo(AssistantMessage);
