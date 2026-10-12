import { useCallback, useEffect, useRef, useState } from "react";
import type { AskRequest } from "../lib/api/ask";
import type { AskResult } from "../lib/errors";
import {
  createRequestController,
  type RequestController,
  type RequestStatus,
  type SubmitInput,
} from "../lib/chat/requestController";

/**
 * React adapter for the request controller (WAIT-06).
 *
 * Mirrors the controller's emissions into React state and
 * owns the controller's lifecycle: one controller per mount,
 * disposed on unmount and on conversation change so an
 * in-flight request is aborted and its late result can never
 * reach React state. The hook never renders, fabricates, or
 * transforms an answer — it only mirrors controller status
 * (CHAT-09).
 */

export interface UseAskControllerOptions {
  ask?: (request: AskRequest, signal?: AbortSignal) => Promise<AskResult>;
  timeoutMs?: number;
  conversationId?: string;
}

export interface UseAskController {
  status: RequestStatus;
  submit: (input: SubmitInput) => void;
  stop: () => void;
}

export function useAskController(
  options?: UseAskControllerOptions,
): UseAskController {
  const ask = options?.ask;
  const timeoutMs = options?.timeoutMs;
  const conversationId = options?.conversationId;

  // One controller per mount, created lazily on first render
  // so the injected options are captured.
  const controllerRef = useRef<RequestController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createRequestController({ ask, timeoutMs });
  }

  const [status, setStatus] = useState<RequestStatus>({ kind: "idle" });

  // Subscribe to the active controller and mirror every
  // emission into React state. Keyed on conversationId: when
  // the conversation changes, the cleanup below disposes the
  // old controller and clears the ref, and this effect
  // re-runs against a fresh instance.
  useEffect(() => {
    if (controllerRef.current === null) {
      controllerRef.current = createRequestController({ ask, timeoutMs });
    }
    const controller = controllerRef.current;
    const unsubscribe = controller.subscribe((next) => {
      setStatus(next);
    });
    return unsubscribe;
  }, [conversationId]);

  // Cleanup on unmount and conversation change (WAIT-06):
  // dispose the controller — the in-flight request is aborted
  // and any result arriving afterwards is dropped silently by
  // the controller's stale-result rule. The ref is cleared so
  // the subscription effect above creates a fresh idle
  // controller for the next conversation.
  useEffect(() => {
    return () => {
      const controller = controllerRef.current;
      controllerRef.current = null;
      controller?.dispose();
      setStatus({ kind: "idle" });
    };
  }, [conversationId]);

  // Stable wrappers: submit and stop delegate to the
  // controller unchanged; the hook adds no transitions of its
  // own.
  const submit = useCallback((input: SubmitInput) => {
    controllerRef.current?.submit(input);
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  return { status, submit, stop };
}
