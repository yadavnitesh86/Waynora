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
 * User turn (CHAT-07, D-30): a real `You` caption plus the one raised card on
 * the surface — elevation marks whose words these are, and the assistant turn
 * stays flat. Three states on the same card:
 *
 * - default: the prompt alone
 * - in-flight: the prompt plus the C-15 footer (Spinner + caption)
 * - failed / reload-recovered: the prompt plus a RecoveryBlock
 *
 * The prompt is never removed by any state — PERSIST-09 means the words the
 * user typed survive every failure.
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
    <div>
      <p className="mb-2xs text-caption text-ink-muted">You</p>
      <div className="max-w-[48ch] rounded-lg border border-line bg-surface-raised px-lg py-md shadow-xs">
        <p className="text-body leading-[1.65] text-ink">{message.content}</p>
        {showInFlightFooter ? (
          <div className="mt-sm flex items-center gap-2xs text-caption text-ink-muted">
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
