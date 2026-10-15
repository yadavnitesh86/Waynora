import { memo } from "react";
import type { Message } from "../../lib/cookie/schema";
import {
  RECOVERY_COPY,
  type RecoveryKind,
} from "../../lib/chat/failure";
import RecoveryBlock from "./RecoveryBlock";
import Spinner from "../ui/Spinner";

export interface UserMessageProps {
  message: Message;
  /** True when this message is owned by the currently active request. */
  isActive: boolean;
  onRetry: (message: Message) => void;
}

/** C-15 — the in-flight footer caption. */
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
 * User turn (CHAT-07, D-30): a real `You` caption plus a double-bezel letterpress card.
 * Elevation marks whose words these are, and the assistant turn stays flat.
 * Three states on the same card:
 *
 * - default: the prompt alone
 * - in-flight: the prompt plus the C-15 footer (Spinner + caption)
 * - failed / reload-recovered: the prompt plus a RecoveryBlock
 */
function UserMessage({ message, isActive, onRetry }: UserMessageProps) {
  const metadata = message.metadata;
  const inFlight = metadata?.inFlight === true;
  const error = metadata?.error;

  const showRecovery = error !== undefined;
  const showReloadRecovery = !showRecovery && inFlight && !isActive;
  const showInFlightFooter =
    !showRecovery && !showReloadRecovery && inFlight;

  return (
    <div className="my-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-caption font-mono text-ink-muted font-semibold tracking-wider">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span>You</span>
      </div>
      <div className="max-w-[56ch] rounded-2xl rounded-tl-xs border border-line/80 bg-surface-raised px-lg py-md sm:px-xl sm:py-lg shadow-sm transition-all">
        <p className="text-body leading-[1.68] text-ink font-normal">{message.content}</p>
        {showInFlightFooter ? (
          <div className="mt-md flex items-center gap-2 rounded-lg bg-accent-soft/70 px-sm py-1.5 text-caption text-accent font-medium border border-accent/20">
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
    </div>
  );
}

export default memo(UserMessage);
