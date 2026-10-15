import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi, afterEach } from "vitest";
import { askBackend, askRequestSchema, askResponseSchema } from "./ask";
import { CUSTOMER_MESSAGES } from "../errors";

vi.mock("../env", () => ({
  env: {
    VITE_API_BASE_URL: "http://localhost:8000",
    VITE_CONVEX_URL: "https://example.convex.cloud",
  },
  envError: [],
  isDev: false,
}));

/** Forbidden contract-drift markers (CONTEXT D-05: no streaming/jobs/progress). */
const FORBIDDEN_SOURCE_MARKERS = [
  "EventSource",
  "ReadableStream",
  "setInterval",
  "progressPercent",
  "jobId",
  "cancelRequest",
] as const;

// `import.meta.url` is read directly (not via `new URL(..., import.meta.url)`,
// which Vite rewrites into an asset URL) and converted with fileURLToPath.
const HERE = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(HERE, "ask.ts"), "utf8");

function stubFetch(response: Partial<Response> = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ answer: "Here is your plan", thread_id: "t-1" }),
    ...response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ask request schema (TM-04)", () => {
  it("accepts question with an optional thread_id", () => {
    expect(
      askRequestSchema.safeParse({ question: "x", thread_id: "t" }).success,
    ).toBe(true);
  });

  it("rejects unknown keys — a streaming flag cannot sneak in", () => {
    expect(
      askRequestSchema.safeParse({ question: "x", stream: true }).success,
    ).toBe(false);
  });
});

describe("ask response schema contract hardening (TM-04, QUAL-02, QUAL-03)", () => {
  it("accepts valid answer + thread_id", () => {
    expect(
      askResponseSchema.safeParse({ answer: "Valid answer", thread_id: "t-1" }).success,
    ).toBe(true);
  });

  it("rejects a response missing thread_id", () => {
    expect(askResponseSchema.safeParse({ answer: "a" }).success).toBe(false);
  });

  it("rejects a response missing answer", () => {
    expect(askResponseSchema.safeParse({ thread_id: "t-1" }).success).toBe(false);
  });

  it("rejects a response with non-string types", () => {
    expect(askResponseSchema.safeParse({ answer: 12345, thread_id: "t-1" }).success).toBe(false);
    expect(askResponseSchema.safeParse({ answer: "a", thread_id: null }).success).toBe(false);
  });

  it("rejects unexpected extra keys via strictObject (prevents schema pollution)", () => {
    expect(
      askResponseSchema.safeParse({
        answer: "a",
        thread_id: "t-1",
        unexpected_extra_field: "injected",
      }).success,
    ).toBe(false);
  });

  it("rejects an empty object", () => {
    expect(askResponseSchema.safeParse({}).success).toBe(false);
  });
});

describe("ask boundary source holds the D-05 contract", () => {
  it("contains no streaming, job, progress, or cancellation markers", () => {
    for (const marker of FORBIDDEN_SOURCE_MARKERS) {
      expect(source.includes(marker), marker).toBe(false);
    }
  });
});

describe("ask wire format", () => {
  it("POSTs to .../ask with exactly the question and thread_id keys", async () => {
    const fetchMock = stubFetch();

    await askBackend({ question: "Plan a trip to Japan", thread_id: "t-1" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url.endsWith("/ask")).toBe(true);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({ question: "Plan a trip to Japan", thread_id: "t-1" }),
    );
  });

  it("omits thread_id entirely when the caller does not supply one", async () => {
    const fetchMock = stubFetch();

    await askBackend({ question: "Plan a trip to Japan" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url.endsWith("/ask")).toBe(true);
    expect(init.body).toBe(JSON.stringify({ question: "Plan a trip to Japan" }));
    expect(Object.keys(JSON.parse(String(init.body)) as Record<string, unknown>)).toEqual([
      "question",
    ]);
  });
});

describe("askBackend HTTP error and payload failure mapping (QUAL-02, QUAL-03)", () => {
  const HTTP_ERROR_STATUSES = [
    { status: 400, name: "Bad Request" },
    { status: 401, name: "Unauthorized" },
    { status: 429, name: "Rate Limit" },
    { status: 500, name: "Internal Error" },
    { status: 504, name: "Gateway Timeout" },
  ];

  for (const { status, name } of HTTP_ERROR_STATUSES) {
    it(`maps HTTP ${status} (${name}) cleanly to { ok: false, kind: "http" } and never fabricates output`, async () => {
      stubFetch({
        ok: false,
        status,
        statusText: name,
      });

      const result = await askBackend({ question: "Where to go?" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe("http");
        expect(result.message).toBe(CUSTOMER_MESSAGES.http);
      }
      expect((result as Record<string, unknown>).answer).toBeUndefined();
    });
  }

  it("maps JSON parse error on 200 response cleanly to { ok: false, kind: 'malformed' }", async () => {
    stubFetch({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("SyntaxError: Unexpected token < in JSON at position 0");
      },
    });

    const result = await askBackend({ question: "Where to go?" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("malformed");
      expect(result.message).toBe(CUSTOMER_MESSAGES.malformed);
    }
  });

  it("maps schema validation mismatch on 200 response cleanly to { ok: false, kind: 'malformed' }", async () => {
    stubFetch({
      ok: true,
      status: 200,
      json: async () => ({ unexpected_schema: true }),
    });

    const result = await askBackend({ question: "Where to go?" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("malformed");
      expect(result.message).toBe(CUSTOMER_MESSAGES.malformed);
    }
  });

  it("maps network fetch failure cleanly to { ok: false, kind: 'network' }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    const result = await askBackend({ question: "Where to go?" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("network");
      expect(result.message).toBe(CUSTOMER_MESSAGES.network);
    }
  });

  it("maps abort signal cleanly to { ok: false, kind: 'abort' }", async () => {
    const abortError = new DOMException("The user aborted a request.", "AbortError");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(abortError),
    );

    const controller = new AbortController();
    controller.abort();

    const result = await askBackend({ question: "Where to go?" }, controller.signal);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("abort");
      expect(result.message).toBe(CUSTOMER_MESSAGES.abort);
    }
  });
});
