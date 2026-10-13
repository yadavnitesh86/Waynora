import type { AskErrorKind } from "../errors";

/**
 * Request-lifecycle failure taxonomy (WAIT-01, WAIT-05).
 *
 * `RequestFailureKind` is the closed union of controller failure
 * outcomes. The persisted `metadata.error` field stores this kind
 * key (a customer-safe, closed-union string); the recovery block
 * maps the key back to display copy via `RECOVERY_COPY`.
 *
 * The internal `CUSTOMER_MESSAGES` strings in `src/lib/errors.ts`
 * remain the data-layer source of truth and are not modified here;
 * this module extends them with the recovery guidance WAIT-05
 * requires. `aborted`'s display copy supersedes
 * `CUSTOMER_MESSAGES.abort` on screen (UI-SPEC failure table).
 */

export type RequestFailureKind =
  | "network"
  | "timeout"
  | "http"
  | "malformed"
  | "unexpected"
  | "aborted";

/**
 * The seventh recovery kind. It is derived at render time from a
 * persisted message whose `metadata.inFlight` is true (D-27,
 * PERSIST-10) and is never stored in `metadata.error`.
 */
export type RecoveryKind = RequestFailureKind | "reload-recovery";

/**
 * Maps a data-layer `AskErrorKind` (plus the abort source, when
 * the kind is `abort`) to the request-level failure kind.
 *
 * - network/http/malformed pass through unchanged.
 * - abort maps by source: the controller's budget timer fires
 *   with source "timeout" (-> "timeout"); the user's deliberate
 *   Stop fires with source "user" (-> "aborted"); a missing
 *   source defaults to "timeout" as the conservative reading.
 * - config and any other kind map to "unexpected".
 */
export function mapRequestFailure(
  askKind: AskErrorKind,
  abortSource: "timeout" | "user" | null,
): RequestFailureKind {
  if (
    askKind === "network" ||
    askKind === "http" ||
    askKind === "malformed" ||
    askKind === "timeout"
  ) {
    return askKind;
  }
  if (askKind === "abort") {
    if (abortSource === "user") {
      return "aborted";
    }
    return "timeout";
  }
  return "unexpected";
}

/**
 * Verbatim recovery copy from the UI-SPEC failure-and-recovery
 * table (em-dashes preserved exactly). Every string is
 * customer-safe: raw error messages, status codes, and stack
 * traces never reach the UI (QUAL-01, T-03-05).
 */
export const RECOVERY_COPY: Record<
  RecoveryKind,
  { headline: string; body: string }
> = {
  network: {
    headline: "We couldn't reach the server.",
    body: "Check your connection and try again. Your request is saved below, and nothing was lost.",
  },
  timeout: {
    headline: "This request took too long.",
    body: "Your trip may still be building on our side. Because it timed out here, trying again would start a second, separate plan. Your request is saved below — try again when you're ready.",
  },
  http: {
    headline: "Something went wrong on our side.",
    body: "Your request is saved below and your conversation is intact. Try again when you're ready.",
  },
  malformed: {
    headline: "We received a response we couldn't read.",
    body: "Your request is saved below and your conversation is intact. Try again when you're ready.",
  },
  unexpected: {
    headline: "Something unexpected happened.",
    body: "Your request is saved below and your conversation is intact. Try again when you're ready.",
  },
  aborted: {
    headline: "Waiting stopped.",
    body: "Your trip may still be building on our side. Your request is saved below — trying again would start a second, separate plan.",
  },
  "reload-recovery": {
    headline: "This request was still running when you left.",
    body: "We can't tell whether it finished, so nothing was restarted for you. Your request is saved below — try again when you're ready.",
  },
};

/** The deliberate recovery action for every kind (never automatic). */
export const RECOVERY_ACTION_LABEL = "Try again";
