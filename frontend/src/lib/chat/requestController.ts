import { askBackend, type AskRequest } from "../api/ask";
import type { AskResult } from "../errors";
import {
  mapRequestFailure,
  type RequestFailureKind,
} from "./failure";

/**
 * Request-lifecycle controller (WAIT-01, WAIT-02, WAIT-06).
 *
 * A framework-agnostic state machine: no UI framework,
 * no browser globals, no timers other than the single
 * budget timer. The hook adapter
 * (src/hooks/useAskController.ts) subscribes to
 * emissions; the UI maps each status to exactly one
 * visual treatment.
 *
 * Honesty contract (CHAT-09): a `succeeded` transition is
 * produced exclusively by a validated backend answer — the
 * controller never fabricates an answer.
 */

/**
 * The 20-minute budget — deliberately above the 15-minute
 * expectation so legitimate work is never interrupted by a
 * "normal short timeout" (WAIT-02).
 */
export const REQUEST_TIMEOUT_MS = 1_200_000;

/** The controller's observable state (WAIT-01). */
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

/** A submitted request. `threadId` rides along only when the
 * conversation already holds one from a prior successful turn
 * (D-35). */
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

/**
 * Creates a controller. `ask` is injectable so tests (and
 * future adapters) can drive every transition without a
 * network; it defaults to the real `askBackend`.
 */
export function createRequestController(options?: {
  ask?: (request: AskRequest, signal?: AbortSignal) => Promise<AskResult>;
  timeoutMs?: number;
}): RequestController {
  const ask = options?.ask ?? askBackend;
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;

  let status: RequestStatus = { kind: "idle" };
  const listeners = new Set<(status: RequestStatus) => void>();

  // Per-instance counter: each submit captures a monotonically
  // increasing requestId, starting at 1.
  let nextRequestId = 1;

  // Slots for the single active request (single-flight rule).
  let activeRequestId = 0;
  let activeAbortController: AbortController | undefined;
  let activeTimer: ReturnType<typeof setTimeout> | undefined;
  let activeAbortSource: "timeout" | "user" | null = null;
  let disposed = false;

  function emit(next: RequestStatus): void {
    status = next;
    for (const listener of listeners) {
      listener(next);
    }
  }

  function submit(input: SubmitInput): void {
    if (disposed) {
      return;
    }
    // Single-flight (CHAT-08): one active request per
    // conversation — a duplicate submission is a no-op and
    // ask is never called twice.
    if (
      status.kind === "submitting" ||
      status.kind === "waiting"
    ) {
      return;
    }

    const requestId = nextRequestId++;
    const abortController = new AbortController();
    activeRequestId = requestId;
    activeAbortController = abortController;
    activeAbortSource = null;

    emit({ kind: "submitting", requestId });

    // The single budget timer: fires abort() with source
    // "timeout" at the 20-minute budget (WAIT-02, T-03-06).
    const timer = setTimeout(() => {
      activeAbortSource = "timeout";
      abortController.abort();
    }, timeoutMs);
    activeTimer = timer;

    let askPromise: Promise<AskResult>;
    try {
      askPromise = ask(
        { question: input.question, thread_id: input.threadId },
        abortController.signal,
      );
    } catch {
      // A synchronous throw from the ask call itself is an
      // unexpected failure, never a crash.
      clearTimeout(timer);
      if (activeTimer === timer) {
        activeTimer = undefined;
        activeAbortController = undefined;
      }
      emit({ kind: "failed", requestId, failure: "unexpected" });
      return;
    }

    // The dispatch instant — fetch exposes no intermediate
    // observable between submitting and waiting.
    emit({ kind: "waiting", requestId });

    askPromise
      .then((result) => {
        // Stale-result rule (WAIT-06, T-03-03): a result is
        // applied only if its request is still the active one
        // and the controller is not disposed. Anything else is
        // dropped silently — never rendered.
        if (disposed || requestId !== activeRequestId) {
          return;
        }
        if (result.ok) {
          emit({
            kind: "succeeded",
            requestId,
            answer: result.answer,
            threadId: result.threadId,
          });
        } else {
          emit({
            kind: "failed",
            requestId,
            failure: mapRequestFailure(result.kind, activeAbortSource),
          });
        }
      })
      .catch(() => {
        if (disposed || requestId !== activeRequestId) {
          return;
        }
        emit({ kind: "failed", requestId, failure: "unexpected" });
      })
      .finally(() => {
        // The timer is cleared on every exit path: success,
        // failure, abort, and dispose (T-03-02).
        clearTimeout(timer);
        if (activeTimer === timer) {
          activeTimer = undefined;
          activeAbortController = undefined;
        }
      });
  }

  function stop(): void {
    // Only while a request is active; the deliberate escape
    // hatch (D-32). The pending ask settles with kind
    // "abort" and flows through the normal failure path.
    if (
      status.kind !== "submitting" &&
      status.kind !== "waiting"
    ) {
      return;
    }
    if (!activeAbortController) {
      return;
    }
    activeAbortSource = "user";
    activeAbortController.abort();
  }

  function dispose(): void {
    // Cleanup on unmount / conversation change (WAIT-06):
    // clear the timer, abort the controller, and mark the
    // instance disposed. Any result arriving afterwards is
    // dropped silently — no status transition, no callback.
    if (activeTimer !== undefined) {
      clearTimeout(activeTimer);
      activeTimer = undefined;
    }
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = undefined;
    }
    disposed = true;
  }

  function subscribe(
    listener: (status: RequestStatus) => void,
  ): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    get status(): RequestStatus {
      return status;
    },
    submit,
    stop,
    dispose,
    subscribe,
  };
}
