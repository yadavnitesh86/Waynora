export type AskErrorKind =
  | "network"
  | "timeout"
  | "http"
  | "malformed"
  | "abort"
  | "config";

export type AskResult =
  | { ok: true; answer: string; threadId: string }
  | { ok: false; kind: AskErrorKind; message: string };

export const CUSTOMER_MESSAGES: Record<AskErrorKind, string> = {
  network: "We couldn't reach the server. Check your connection and try again.",
  timeout: "The request took too long. Please try again.",
  http: "Something went wrong. Please try again.",
  malformed: "We received an unexpected response. Please try again.",
  abort: "The request was cancelled.",
  config: "The app is not configured correctly. Please contact support.",
};

/**
 * Generic auth failure copy (TM-04, UI-SPEC copy contract).
 * Auth forms map EVERY provider failure to one of these strings — raw
 * provider error messages are never rendered in the UI.
 */
export const AUTH_GENERIC_FAILURE =
  "We couldn't sign you in. Check your email and password and try again.";

export const AUTH_SIGNUP_GENERIC_FAILURE =
  "We couldn't create your account. Try a different email address, or sign in if you already have one.";
