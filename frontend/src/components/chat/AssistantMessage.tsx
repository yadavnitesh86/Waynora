import { memo } from "react";
import type { Message } from "../../lib/cookie/schema";
import { Markdown } from "../Markdown";

export interface AssistantMessageProps {
  message: Message;
}

/**
 * Assistant turn (CHAT-06, CHAT-07, D-30): a `Waynora` caption,
 * luxury atelier badge, hairline rule, and the answer flat on the canvas.
 *
 * The answer renders through the UNCHANGED `Markdown` component. It is not
 * wrapped, restyled, or replaced: that component makes raw HTML and
 * unsafe URL schemes inert, preserving security contracts (CHAT-06, QUAL-03).
 */
function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="border-t border-line/70 pt-lg my-md">
      <div className="mb-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-gold/40 bg-accent text-[11px] font-bold text-accent-ink shadow-2xs">
            W
          </div>
          <span className="font-display text-small font-semibold tracking-wide text-accent">
            Waynora
          </span>
        </div>
        <span className="rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gold-muted font-semibold">
          Itinerary Synthesis
        </span>
      </div>

      <div className="rounded-2xl border border-line/60 bg-surface/50 p-lg sm:p-xl shadow-2xs">
        <Markdown content={message.content} />
      </div>
    </div>
  );
}

export default memo(AssistantMessage);
