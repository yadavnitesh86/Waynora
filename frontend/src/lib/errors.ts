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
