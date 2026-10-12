import type { AskErrorKind } from "../errors";

/**
 * RED scaffold — type-correct, behavior-wrong (tdd.md #3770).
 * Exports the real shapes so the test fails on its planned
 * assertions, never on module resolution. The real mapping and
 * the verbatim recovery copy land in the GREEN commit.
 */

export type RequestFailureKind =
  | "network"
  | "timeout"
  | "http"
  | "malformed"
  | "unexpected"
  | "aborted";

export type RecoveryKind = RequestFailureKind | "reload-recovery";

export function mapRequestFailure(
  _askKind: AskErrorKind,
  _abortSource: "timeout" | "user" | null,
): RequestFailureKind {
  return "unexpected";
}

export const RECOVERY_COPY: Record<
  RecoveryKind,
  { headline: string; body: string }
> = {
  network: { headline: "scaffold", body: "scaffold" },
  timeout: { headline: "scaffold", body: "scaffold" },
  http: { headline: "scaffold", body: "scaffold" },
  malformed: { headline: "scaffold", body: "scaffold" },
  unexpected: { headline: "scaffold", body: "scaffold" },
  aborted: { headline: "scaffold", body: "scaffold" },
  "reload-recovery": { headline: "scaffold", body: "scaffold" },
};

export const RECOVERY_ACTION_LABEL = "scaffold";
