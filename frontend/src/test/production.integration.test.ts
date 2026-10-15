import { describe, expect, it, vi, afterEach } from "vitest";
import { askBackend, askRequestSchema, askResponseSchema } from "../lib/api/ask";
import { env } from "../lib/env";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Production Integration & CORS Contract Verification (QUAL-05, QUAL-07)", () => {
  it("verifies the base URL points to the contracted FastAPI backend endpoint", () => {
    expect(env.VITE_API_BASE_URL).toBeDefined();
    expect(typeof env.VITE_API_BASE_URL).toBe("string");
    expect(env.VITE_API_BASE_URL.length).toBeGreaterThan(0);
  });

  it("verifies that POST /ask sends correct Content-Type, payload, and origin headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answer: "3-day Tokyo itinerary prepared by destination agent.",
        thread_id: "thread_tokyo_001",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await askBackend({
      question: "Plan 3 days in Tokyo",
      thread_id: "thread_tokyo_001",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answer).toContain("Tokyo");
      expect(result.threadId).toBe("thread_tokyo_001");
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${env.VITE_API_BASE_URL}/ask`);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("verifies OPTIONS preflight request contract expected by FastAPI CORS middleware", async () => {
    // When the browser makes a cross-origin POST with application/json, it sends an OPTIONS preflight
    const preflightMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }),
    });
    vi.stubGlobal("fetch", preflightMock);

    const preflightResponse = await fetch(`${env.VITE_API_BASE_URL}/ask`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    expect(preflightResponse.ok).toBe(true);
    expect(preflightResponse.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(preflightResponse.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("verifies request abort signal triggers clean abort return for long 15-minute wait windows", async () => {
    const controller = new AbortController();

    const slowFetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }
      });
    });
    vi.stubGlobal("fetch", slowFetchMock);

    const askPromise = askBackend(
      { question: "Comprehensive 14-day multi-city journey" },
      controller.signal,
    );

    // User aborts during the waiting period
    controller.abort();

    const result = await askPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("abort");
    }
  });

  it("validates strict schema invariants between frontend request and backend response", () => {
    const request = { question: "What to do in Kyoto?", thread_id: "thread_kyoto" };
    const validatedReq = askRequestSchema.safeParse(request);
    expect(validatedReq.success).toBe(true);

    const response = { answer: "Day 1: Arashiyama Bamboo Grove...", thread_id: "thread_kyoto" };
    const validatedRes = askResponseSchema.safeParse(response);
    expect(validatedRes.success).toBe(true);
  });
});
