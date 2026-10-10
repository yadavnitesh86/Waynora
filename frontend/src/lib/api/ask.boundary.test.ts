import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi, afterEach } from "vitest";
import { askBackend, askRequestSchema, askResponseSchema } from "./ask";

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

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ answer: "Here is your plan", thread_id: "t-1" }),
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

describe("ask response schema (TM-04)", () => {
  it("accepts answer + thread_id", () => {
    expect(
      askResponseSchema.safeParse({ answer: "a", thread_id: "t" }).success,
    ).toBe(true);
  });

  it("rejects a response without thread_id", () => {
    expect(askResponseSchema.safeParse({ answer: "a" }).success).toBe(false);
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
