import type { AskRequest } from "../api/ask";
import type { AskResult } from "../errors";
import type { RequestFailureKind } from "./failure";

/**
 * RED scaffold — type-correct, behavior-wrong (tdd.md #3770).
 * Exports the real shapes so the test fails on its planned
 * assertions, never on module resolution. The state machine
 * lands in the GREEN commit.
 */

export const REQUEST_TIMEOUT_MS = 0;

export type RequestStatus =
  | { kind: "idle" }
  | { kind: "submitting"; requestId: number }
  | { kind: "waiting"; requestId: number }
  | {
      kind: "succeeded";
      requestId: number;
      answer: string;
      threadId: string;
    }
  | { kind: "failed"; requestId: number; failure: RequestFailureKind };

export interface SubmitInput {
  conversationId: string;
  messageId: string;
  question: string;
  threadId?: string;
}

export interface RequestController {
  readonly status: RequestStatus;
  submit(input: SubmitInput): void;
  stop(): void;
  dispose(): void;
  subscribe(listener: (status: RequestStatus) => void): () => void;
}

export function createRequestController(_options?: {
  ask?: (request: AskRequest, signal?: AbortSignal) => Promise<AskResult>;
  timeoutMs?: number;
}): RequestController {
  let status: RequestStatus = { kind: "idle" };
  const listeners = new Set<(status: RequestStatus) => void>();

  return {
    get status(): RequestStatus {
      return status;
    },
    submit(_input: SubmitInput): void {
      // RED scaffold: no transitions, no dispatch.
    },
    stop(): void {
      // RED scaffold: no-op.
    },
    dispose(): void {
      // RED scaffold: no-op.
    },
    subscribe(listener: (status: RequestStatus) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
