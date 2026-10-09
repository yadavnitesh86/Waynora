import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { askBackend, askRequestSchema } from "./ask";

vi.mock("../env", () => ({
  env: {
    VITE_API_BASE_URL: "http://localhost:8000",
    VITE_CONVEX_URL: "https://example.convex.cloud",
  },
  envError: [],
  isDev: false,
}));

describe("askBackend", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serializes a valid request to exact JSON", () => {
    const request = askRequestSchema.parse({
      question: "Plan a trip to Japan",
      thread_id: "thread-123",
    });
    expect(JSON.stringify(request)).toBe(
      '{"question":"Plan a trip to Japan","thread_id":"thread-123"}',
    );
  });

  it("parses a valid response and returns ok: true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "Here is your plan", thread_id: "t-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await askBackend({
      question: "Plan a trip",
      thread_id: "t-1",
    });
    expect(result).toEqual({
      ok: true,
      answer: "Here is your plan",
      threadId: "t-1",
    });
  });

  it("rejects extra/unknown keys as malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "Answer",
        thread_id: "t-1",
        extra: "bad",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await askBackend({
      question: "Plan a trip",
      thread_id: "t-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("malformed");
    }
  });

  it("rejects missing thread_id as malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "Answer" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await askBackend({
      question: "Plan a trip",
      thread_id: "t-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("malformed");
    }
  });

  it("returns http error for non-2xx responses without leaking body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: "Internal Server Error" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await askBackend({
      question: "Plan a trip",
      thread_id: "t-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("http");
      expect(result.message).not.toContain("Internal Server Error");
      expect(result.message).not.toContain("500");
    }
  });

  it("returns abort for AbortError", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await askBackend({
      question: "Plan a trip",
      thread_id: "t-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("abort");
    }
  });
});
