// @vitest-environment node
// The controller is a framework-agnostic state machine (no
// React, no DOM), so the node environment with fake timers is
// the correct place to drive every transition.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRequestController,
  REQUEST_TIMEOUT_MS,
  type RequestController,
  type RequestStatus,
  type SubmitInput,
} from "./requestController";
import type { AskRequest } from "../api/ask";
import type { AskResult } from "../errors";

// The controller's default ask is askBackend, whose module reads
// import.meta.env at load time. Tests inject their own ask, so the
// env module is mocked to keep the node environment deterministic
// (same pattern as domain.test.ts).
vi.mock("../env", () => ({
  env: {
    VITE_API_BASE_URL: "http://localhost:8000",
    VITE_CONVEX_URL: "https://example.convex.cloud",
  },
  envError: [],
  isDev: false,
}));

const QUESTION = "Plan a 10-day trip to Japan in April";

function input(overrides: Partial<SubmitInput> = {}): SubmitInput {
  return {
    conversationId: "conv-1",
    messageId: "msg-1",
    question: QUESTION,
    ...overrides,
  };
}

function success(
  answer = "Here is your plan",
  threadId = "thread-1",
): AskResult {
  return { ok: true, answer, threadId };
}

/** A manually-resolvable ask promise, like a controlled fetch. */
function createDeferredAsk() {
  let resolve!: (result: AskResult) => void;
  const promise = new Promise<AskResult>((res) => {
    resolve = res;
  });
  const ask = vi.fn(() => promise);
  return { ask, resolve };
}

/**
 * An ask that mirrors askBackend's abort contract: when the signal
 * aborts, it settles with { ok: false, kind: "abort" } — exactly
 * what a real fetch does on AbortError.
 */
function createSignalAwareAsk() {
  const ask = vi.fn(
    (_request: AskRequest, signal?: AbortSignal) =>
      new Promise<AskResult>((resolve) => {
        const settleAborted = () =>
          resolve({
            ok: false,
            kind: "abort",
            message: "The request was cancelled.",
          });
        if (!signal) {
          return;
        }
        if (signal.aborted) {
          settleAborted();
          return;
        }
        signal.addEventListener("abort", settleAborted);
      }),
  );
  return { ask };
}

/** A fresh deferred per call, for tests that submit more than once. */
function createAskQueue() {
  const queue: Array<{
    resolve: (result: AskResult) => void;
    promise: Promise<AskResult>;
  }> = [];
  const ask = vi.fn(() => {
    let resolve!: (result: AskResult) => void;
    const promise = new Promise<AskResult>((res) => {
      resolve = res;
    });
    queue.push({ resolve, promise });
    return promise;
  });
  return {
    ask,
    resolveAt: (index: number, result: AskResult) => {
      queue[index]!.resolve(result);
    },
  };
}

/**
 * Drain multi-hop promise chains (.then/.catch/.finally each add
 * a microtask hop; a single await is not enough).
 */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe("request controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("constants and initial state", () => {
    it("sets the timeout budget to 20 minutes", () => {
      expect(REQUEST_TIMEOUT_MS).toBe(1_200_000);
    });

    it("starts idle", () => {
      const controller = createRequestController();

      expect(controller.status).toEqual({ kind: "idle" });
    });
  });

  describe("submit", () => {
    it("transitions idle -> submitting -> waiting and dispatches ask once", () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());

      expect(ask).toHaveBeenCalledTimes(1);
      expect(ask).toHaveBeenCalledWith(
        { question: QUESTION, thread_id: undefined },
        expect.any(AbortSignal),
      );
      expect(statuses[0]).toEqual({ kind: "submitting", requestId: 1 });
      expect(statuses[1]).toEqual({ kind: "waiting", requestId: 1 });
      expect(controller.status).toEqual({ kind: "waiting", requestId: 1 });
      resolve(success());
    });

    it("passes thread_id through when the conversation holds one (D-35)", () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });

      controller.submit(input({ threadId: "thread-42" }));

      expect(ask).toHaveBeenCalledWith(
        { question: QUESTION, thread_id: "thread-42" },
        expect.any(AbortSignal),
      );
      resolve(success());
    });

    it("emits succeeded with the validated answer and threadId", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      resolve(success("Your Japan plan", "thread-7"));
      await flush();

      expect(statuses[2]).toEqual({
        kind: "succeeded",
        requestId: 1,
        answer: "Your Japan plan",
        threadId: "thread-7",
      });
      expect(controller.status).toEqual({
        kind: "succeeded",
        requestId: 1,
        answer: "Your Japan plan",
        threadId: "thread-7",
      });
    });

    it("emits failed with the mapped failure kind", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      resolve({ ok: false, kind: "network", message: "down" });
      await flush();

      expect(statuses[2]).toEqual({
        kind: "failed",
        requestId: 1,
        failure: "network",
      });
    });

    it("maps a synchronous throw from ask to unexpected", async () => {
      const ask = vi.fn(() => {
        throw new Error("boom");
      });
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      await flush();

      expect(statuses[0]).toEqual({ kind: "submitting", requestId: 1 });
      expect(statuses[1]).toEqual({
        kind: "failed",
        requestId: 1,
        failure: "unexpected",
      });
    });
  });

  describe("single-flight rule (CHAT-08)", () => {
    it("ignores a second submit while waiting and never calls ask twice", () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });

      controller.submit(input());
      controller.submit(input({ question: "Another question" }));
      controller.submit(input({ question: "Yet another" }));

      expect(ask).toHaveBeenCalledTimes(1);
      expect(ask).toHaveBeenCalledWith(
        { question: QUESTION, thread_id: undefined },
        expect.any(AbortSignal),
      );
      resolve(success());
    });

    it("ignores a re-entrant submit issued while still submitting", () => {
      const { ask, resolve } = createDeferredAsk();
      let controller: RequestController;
      const reentrantAsk = vi.fn(
        (request: AskRequest, signal?: AbortSignal) => {
          // Re-enter while the status is still "submitting".
          controller.submit(input({ question: "re-entrant" }));
          return ask(request, signal);
        },
      );
      controller = createRequestController({ ask: reentrantAsk });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());

      expect(reentrantAsk).toHaveBeenCalledTimes(1);
      expect(
        statuses.filter((status) => status.kind === "submitting"),
      ).toHaveLength(1);
      expect(
        statuses.filter((status) => status.kind === "waiting"),
      ).toHaveLength(1);
      resolve(success());
    });
  });

  describe("timeout budget (WAIT-02)", () => {
    it("aborts with failure 'timeout' when the budget elapses", async () => {
      const { ask } = createSignalAwareAsk();
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      await flush();

      expect(statuses[2]).toEqual({
        kind: "failed",
        requestId: 1,
        failure: "timeout",
      });
      expect(controller.status).toEqual({
        kind: "failed",
        requestId: 1,
        failure: "timeout",
      });
    });

    it("does not fire before the budget elapses", async () => {
      const { ask } = createSignalAwareAsk();
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
      await flush();

      expect(statuses).toHaveLength(2);
      expect(controller.status).toEqual({ kind: "waiting", requestId: 1 });
    });

    it("honours a custom timeoutMs", async () => {
      const { ask } = createSignalAwareAsk();
      const controller = createRequestController({ ask, timeoutMs: 1_000 });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      await vi.advanceTimersByTimeAsync(1_000);
      await flush();

      expect(statuses[2]).toEqual({
        kind: "failed",
        requestId: 1,
        failure: "timeout",
      });
    });
  });

  describe("user stop (WAIT-05)", () => {
    it("aborts with failure 'aborted' when the user stops waiting", async () => {
      const { ask } = createSignalAwareAsk();
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      controller.stop();
      await flush();

      expect(statuses[2]).toEqual({
        kind: "failed",
        requestId: 1,
        failure: "aborted",
      });
      expect(controller.status).toEqual({
        kind: "failed",
        requestId: 1,
        failure: "aborted",
      });
    });

    it("is a no-op when no request is active", () => {
      const controller = createRequestController();

      expect(() => controller.stop()).not.toThrow();
      expect(controller.status).toEqual({ kind: "idle" });
    });
  });

  describe("stale-result rule (WAIT-06)", () => {
    it("drops the result silently after dispose", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });
      const listener = vi.fn();
      controller.subscribe(listener);

      controller.submit(input());
      controller.dispose();
      const emissionsAtDispose = listener.mock.calls.length;

      resolve(success("late answer", "late-thread"));
      await flush();

      expect(listener.mock.calls.length).toBe(emissionsAtDispose);
      expect(controller.status).toEqual({ kind: "waiting", requestId: 1 });
    });

    it("drops a late failure after dispose without an unhandled rejection", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });
      controller.subscribe(() => {});

      controller.submit(input());
      controller.dispose();

      resolve({ ok: false, kind: "http", message: "500" });
      await flush();

      expect(controller.status).toEqual({ kind: "waiting", requestId: 1 });
    });
  });

  describe("timer cleanup (T-03-02)", () => {
    it("clears the budget timer when the request succeeds", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });

      controller.submit(input());
      expect(vi.getTimerCount()).toBe(1);

      resolve(success());
      await flush();

      expect(vi.getTimerCount()).toBe(0);
    });

    it("clears the budget timer when the request fails", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });

      controller.submit(input());
      resolve({ ok: false, kind: "http", message: "500" });
      await flush();

      expect(vi.getTimerCount()).toBe(0);
    });

    it("clears the budget timer on dispose", () => {
      const { ask } = createDeferredAsk();
      const controller = createRequestController({ ask });

      controller.submit(input());
      controller.dispose();

      expect(vi.getTimerCount()).toBe(0);
    });

    it("changes nothing when the budget elapses after success", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });
      const statuses: RequestStatus[] = [];
      controller.subscribe((status) => statuses.push(status));

      controller.submit(input());
      resolve(success());
      await flush();

      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      await flush();

      expect(statuses).toHaveLength(3);
      expect(controller.status.kind).toBe("succeeded");
    });
  });

  describe("request ids", () => {
    it("increases monotonically across submits", async () => {
      const { ask, resolveAt } = createAskQueue();
      const controller = createRequestController({ ask });
      const submissions: RequestStatus[] = [];
      controller.subscribe((status) => submissions.push(status));

      controller.submit(input({ messageId: "msg-1" }));
      resolveAt(0, success());
      await flush();

      controller.submit(input({ messageId: "msg-2" }));
      resolveAt(1, success());
      await flush();

      controller.submit(input({ messageId: "msg-3" }));

      const submitting = submissions.filter(
        (status) => status.kind === "submitting",
      );
      expect(submitting[0]).toEqual({ kind: "submitting", requestId: 1 });
      expect(submitting[1]).toEqual({ kind: "submitting", requestId: 2 });
      expect(submitting[2]).toEqual({ kind: "submitting", requestId: 3 });
    });
  });

  describe("subscribe", () => {
    it("stops notifying an unsubscribed listener", async () => {
      const { ask, resolve } = createDeferredAsk();
      const controller = createRequestController({ ask });
      const listener = vi.fn();
      const unsubscribe = controller.subscribe(listener);

      unsubscribe();
      controller.submit(input());
      resolve(success());
      await flush();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
