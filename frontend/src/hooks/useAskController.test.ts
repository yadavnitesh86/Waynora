import { renderHook, act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAskController } from "./useAskController";
import type { RequestStatus } from "../lib/chat/requestController";
import type { AskResult } from "../lib/errors";

/**
 * A controllable fake ask: the test settles the deferred promise
 * manually, so every controller transition is driven without a
 * network. Records every call's payload and AbortSignal so tests
 * can prove disposal (the signal aborts when the controller is
 * disposed).
 */
function createFakeAsk() {
  const calls: Array<{
    question: string;
    threadId?: string;
    signal?: AbortSignal;
  }> = [];
  let settle: ((result: AskResult) => void) | null = null;
  const ask = vi.fn(
    (
      request: { question: string; thread_id?: string },
      signal?: AbortSignal,
    ): Promise<AskResult> => {
      calls.push({
        question: request.question,
        threadId: request.thread_id,
        signal,
      });
      return new Promise<AskResult>((resolve) => {
        settle = resolve;
      });
    },
  );
  return {
    ask,
    calls,
    resolve(result: AskResult) {
      settle?.(result);
      settle = null;
    },
  };
}

describe("useAskController", () => {
  afterEach(() => {
    cleanup();
  });

  it("starts at idle", () => {
    const { result } = renderHook(() => useAskController());
    expect(result.current.status).toEqual({ kind: "idle" });
  });

  it("drives idle -> submitting -> waiting -> succeeded, carrying the answer and threadId", async () => {
    const fake = createFakeAsk();
    // Captured when the controller dispatches the ask: the
    // "submitting" emission has fired, "waiting" has not.
    let statusAtDispatch: RequestStatus | null = null;
    const holder: { current: { status: RequestStatus } | null } = {
      current: null,
    };
    const ask = vi.fn(
      (
        request: { question: string; thread_id?: string },
        signal?: AbortSignal,
      ): Promise<AskResult> => {
        statusAtDispatch = holder.current?.status ?? null;
        return fake.ask(request, signal);
      },
    );
    const hook = renderHook(() => useAskController({ ask }));
    holder.current = hook.result;

    act(() => {
      hook.result.current.submit({
        conversationId: "conv-1",
        messageId: "msg-1",
        question: "10 days in Japan in April",
      });
    });

    // The controller emitted "submitting" before dispatching.
    expect(statusAtDispatch).toEqual({ kind: "submitting", requestId: 1 });
    // After the synchronous dispatch it is "waiting".
    expect(hook.result.current.status).toEqual({
      kind: "waiting",
      requestId: 1,
    });
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]?.question).toBe("10 days in Japan in April");

    await act(async () => {
      fake.resolve({
        ok: true,
        answer: "Your 10-day Japan plan",
        threadId: "thread-1",
      });
    });

    expect(hook.result.current.status).toEqual({
      kind: "succeeded",
      requestId: 1,
      answer: "Your 10-day Japan plan",
      threadId: "thread-1",
    });
  });

  it("disposes on unmount: aborts the in-flight request and drops the late result silently", async () => {
    const fake = createFakeAsk();
    const { result, unmount } = renderHook(() =>
      useAskController({ ask: fake.ask }),
    );

    act(() => {
      result.current.submit({
        conversationId: "conv-1",
        messageId: "msg-1",
        question: "A long trip",
      });
    });
    expect(result.current.status.kind).toBe("waiting");

    unmount();

    // dispose() aborted the single in-flight request (WAIT-06).
    expect(fake.calls[0]?.signal?.aborted).toBe(true);

    // A result arriving after unmount is dropped: no status
    // transition, no crash, no state update.
    await act(async () => {
      fake.resolve({ ok: true, answer: "late answer", threadId: "thread-x" });
    });
    expect(result.current.status.kind).toBe("waiting");
  });

  it("disposes the old controller and resets to idle when conversationId changes", async () => {
    const fake = createFakeAsk();
    const { result, rerender } = renderHook(
      ({ conversationId }: { conversationId: string }) =>
        useAskController({ ask: fake.ask, conversationId }),
      { initialProps: { conversationId: "conv-1" } },
    );

    act(() => {
      result.current.submit({
        conversationId: "conv-1",
        messageId: "msg-1",
        question: "First conversation",
      });
    });
    expect(result.current.status.kind).toBe("waiting");
    const firstSignal = fake.calls[0]?.signal;

    rerender({ conversationId: "conv-2" });

    // The old controller was disposed — its request aborted.
    expect(firstSignal?.aborted).toBe(true);
    // A fresh idle controller serves the new conversation.
    expect(result.current.status).toEqual({ kind: "idle" });

    act(() => {
      result.current.submit({
        conversationId: "conv-2",
        messageId: "msg-2",
        question: "Second conversation",
      });
    });
    expect(result.current.status.kind).toBe("waiting");
    expect(fake.calls).toHaveLength(2);
    expect(fake.calls[1]?.question).toBe("Second conversation");
  });

  it("delegates stop() to the controller, producing an aborted failure", async () => {
    const fake = createFakeAsk();
    const { result } = renderHook(() => useAskController({ ask: fake.ask }));

    act(() => {
      result.current.submit({
        conversationId: "conv-1",
        messageId: "msg-1",
        question: "A stoppable request",
      });
    });
    expect(result.current.status.kind).toBe("waiting");

    act(() => {
      result.current.stop();
    });

    // The abort settles the fake ask as an abort failure.
    await act(async () => {
      fake.resolve({ ok: false, kind: "abort", message: "aborted" });
    });
    expect(result.current.status).toEqual({
      kind: "failed",
      requestId: 1,
      failure: "aborted",
    });
  });
});
