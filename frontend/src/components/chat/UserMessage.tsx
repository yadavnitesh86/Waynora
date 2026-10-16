import { memo } from "react";
import type { Message } from "../../lib/cookie/schema";
import {
  RECOVERY_COPY,
  type RecoveryKind,
} from "../../lib/chat/failure";
import RecoveryBlock from "./RecoveryBlock";
import Spinner from "../ui/Spinner";
import { WaitingTimer } from "./WaitingShell";

export interface UserMessageProps {
  message: Message;
  /** True when this message is owned by the currently active request. */
  isActive: boolean;
  onRetry: (message: Message) => void;
  /**
   * Elapsed request time and the stop handler. Both are supplied only for
   * the active in-flight message, which is the one that renders its waiting
   * state inside its own bubble. Every other bubble renders bare.
   */
  elapsedMs?: number;
  onStop?: () => void;
}

/** C-15 — the in-flight footer caption, used when no live timer is attached. */
const IN_FLIGHT_CAPTION = "Waiting for your plan";

/**
 * A persisted `metadata.error` key maps back to a display kind. An unknown
 * key is a corrupt-cookie artifact, not a crash: it falls back to the
 * conservative `unexpected` block so the user still sees an honest, safe
 * message and a way out.
 */
function resolveRecoveryKind(error: string | undefined): RecoveryKind {
  if (error !== undefined && Object.hasOwn(RECOVERY_COPY, error)) {
    return error as RecoveryKind;
  }
  return "unexpected";
}

/**
 * User turn (CHAT-07, D-30): a right-aligned caption plus a single raised
 * card, so the conversation reads as a dialogue — your words on the right,
 * the itinerary on the left.
 *
 * Three states on the same card:
 *
 * - default: the prompt alone
 * - in-flight: the prompt plus its waiting state. When the route supplies
 *   the live timer, the waiting UI (elapsed, expectation, stop control) lives
 *   here, attached to the request it belongs to, instead of floating
 *   detached under the composer. Without it, the C-15 footer stands in.
 * - failed / reload-recovered: the prompt plus a RecoveryBlock
 */
function UserMessage({
  message,
  isActive,
  onRetry,
  elapsedMs,
  onStop,
}: UserMessageProps) {
  const metadata = message.metadata;
  const inFlight = metadata?.inFlight === true;
  const error = metadata?.error;

  const showRecovery = error !== undefined;
  const showReloadRecovery = !showRecovery && inFlight && !isActive;
  const showInFlightFooter =
    !showRecovery && !showReloadRecovery && inFlight;

  return (
    <article className="flex flex-col items-end">
      <div className="mb-xs flex items-center gap-2xs font-mono text-overline font-semibold uppercase tracking-[0.14em] text-ink-muted">
        <span>You</span>
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-accent"
        />
      </div>

      <div className="max-w-[58ch] rounded-2xl rounded-tr-md border border-line/80 bg-surface-raised px-lg py-md shadow-sm transition-colors sm:px-xl sm:py-lg">
        <p className="whitespace-pre-wrap text-body leading-[1.68] text-ink">
          {message.content}
        </p>

        {isActive && inFlight && elapsedMs !== undefined && onStop !== undefined ? (
          // The waiting state travels with the message it belongs to. The
          // inline condition keeps `elapsedMs`/`onStop` narrowed for TS.
          <div className="mt-md w-full">
            <WaitingTimer compact elapsedMs={elapsedMs} onStop={onStop} />
          </div>
        ) : showInFlightFooter ? (
          <div className="mt-md flex items-center gap-xs rounded-lg border border-accent/20 bg-accent-soft/70 px-sm py-xs text-caption font-medium text-accent">
            <Spinner size="sm" />
            <span>{IN_FLIGHT_CAPTION}</span>
          </div>
        ) : null}

        {showRecovery ? (
          <RecoveryBlock
            kind={resolveRecoveryKind(error)}
            onRetry={() => onRetry(message)}
          />
        ) : null}

        {showReloadRecovery ? (
          <RecoveryBlock
            kind="reload-recovery"
            onRetry={() => onRetry(message)}
          />
        ) : null}
      </div>
    </article>
  );
}

export default memo(UserMessage);
