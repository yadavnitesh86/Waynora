import { useCallback, useEffect, useRef, useState } from "react";
import type { AskRequest } from "../lib/api/ask";
import type { AskResult } from "../lib/errors";
import type {
  RequestController,
  RequestStatus,
  SubmitInput,
} from "../lib/chat/requestController";

/**
 * RED scaffold — type-correct, behavior-wrong (tdd.md #3770).
 * Exports the real hook shape so the tests fail on their planned
 * assertions, never on module resolution. The real adapter lands
 * in the GREEN commit.
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
  _options?: UseAskControllerOptions,
): UseAskController {
  const controllerRef = useRef<RequestController | null>(null);
  const [status, setStatus] = useState<RequestStatus>({ kind: "idle" });

  // RED scaffold: never creates a controller, never subscribes,
  // never disposes — every behavior assertion fails.
  const submit = useCallback((_input: SubmitInput) => {
    setStatus({ kind: "idle" });
  }, []);
  const stop = useCallback(() => {
    setStatus({ kind: "idle" });
  }, []);

  return { status, submit, stop };
}
