import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Conversation } from "../lib/cookie/schema";
import type { AskResult } from "../lib/errors";

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockAsk, mockReadConversations, mockWriteConversations, mockMarkdownRenderCount } =
  vi.hoisted(() => ({
    mockAsk: vi.fn(),
    mockReadConversations: vi.fn(),
    mockWriteConversations: vi.fn(),
    mockMarkdownRenderCount: { count: 0 },
  }));

vi.mock("../lib/api/ask", () => ({ askBackend: mockAsk }));

vi.mock("../lib/cookie/repository", () => ({
  readConversations: mockReadConversations,
  writeConversations: mockWriteConversations,
}));

// Mock Markdown so we can count its render calls (re-render discipline)
vi.mock("../components/Markdown", () => ({
  Markdown: ({ content }: { content: string }) => {
    mockMarkdownRenderCount.count++;
    return <div data-testid="markdown-mock">{content}</div>;
  },
}));

import Chat from "./Chat";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv-1",
    title: "New chat",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    messages: [],
    ...overrides,
  };
}

function stubSnapshot(conversations: Conversation[]) {
  mockReadConversations.mockReturnValue({
    conversations,
    recovered: false,
    evicted: [],
  });
}

function typeAndSubmit(text: string) {
  const textarea = screen.getByLabelText("Your trip request");
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });
}

function inTranscript() {
  return within(screen.getByRole("list", { name: "Conversation" }));
}

/** Pending ask promise the test resolves manually. */
let settleAsk: ((result: AskResult) => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  settleAsk = null;
  mockMarkdownRenderCount.count = 0;
  mockAsk.mockImplementation(
    () =>
      new Promise<AskResult>((resolve) => {
        settleAsk = resolve;
      }),
  );
  mockWriteConversations.mockReturnValue({
    conversations: [],
    recovered: false,
    evicted: [],
  });
  stubSnapshot([makeConversation()]);
  document.documentElement.setAttribute("lang", "en");
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Chat lifecycle — LONG-REQUEST", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("shows the waiting shell with advancing elapsed and band copy, without re-rendering Markdown", () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );

    // Flush initial render
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText("Where do you want to go?")).toBeInTheDocument();

    typeAndSubmit("10 days in Japan in April");

    // Flush the submit
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // The waiting shell is visible
    expect(
      screen.getByText("Waynora is planning your trip"),
    ).toBeInTheDocument();
    expect(screen.getByText("Elapsed")).toBeInTheDocument();
    expect(
      screen.getByText("Plans usually take 15 to 20 minutes."),
    ).toBeInTheDocument();

    // Elapsed starts at 0:00
    expect(screen.getByText("0:00")).toBeInTheDocument();

    // Band A variant 0 at 0ms
    expect(screen.getByText("Reading your request.")).toBeInTheDocument();

    const markdownCountBefore = mockMarkdownRenderCount.count;

    // Advance past 60s — band B
    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    // Elapsed readout advances to 1:01
    expect(screen.getByText("1:01")).toBeInTheDocument();

    // Band copy moved to band B variant 1 (floor(61000/45000)%2 = 1)
    expect(
      screen.getByText("Looking at places that fit your trip."),
    ).toBeInTheDocument();

    // Markdown render count stays flat (re-render discipline)
    expect(mockMarkdownRenderCount.count).toBe(markdownCountBefore);
  });
});

describe("Chat lifecycle — STALE-RESULT", () => {
  it("drops a result that arrives after unmount — no assistant message, no crash", async () => {
    const { unmount } = render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A long trip");

    // Waiting shell is visible
    expect(
      await screen.findByText("Waynora is planning your trip"),
    ).toBeInTheDocument();

    // Unmount while the fake ask is still pending
    unmount();

    // Resolve after unmount — must not crash or render anything
    await act(async () => {
      settleAsk?.({ ok: true, answer: "late plan", threadId: "thread-late" });
    });

    // No assistant message ever rendered (the component is gone, but the
    // assertion proves no unhandled rejection or state update on the dead tree)
    expect(screen.queryByText("late plan")).not.toBeInTheDocument();
  });
});

describe("Chat lifecycle — RETRY", () => {
  it("re-sends the identical question with no thread_id on first-turn retry", async () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    await act(async () => {
      settleAsk?.({ ok: false, kind: "network", message: "down" });
    });

    // Network recovery block
    expect(
      await screen.findByText("We couldn't reach the server."),
    ).toBeInTheDocument();

    // Click Try again
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(2));
    expect(mockAsk.mock.calls[1]?.[0]).toEqual({
      question: "A trip to Paris",
      thread_id: undefined,
    });
  });

  it("includes the stored thread_id on retry after a successful turn", async () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    await screen.findByText("Where do you want to go?");

    // First turn succeeds
    typeAndSubmit("10 days in Japan in April");
    await act(async () => {
      settleAsk?.({
        ok: true,
        answer: "## Japan plan\n\nDay one in Kyoto.",
        threadId: "thread-1",
      });
    });
    await screen.findByText(/Day one in Kyoto/);

    // Second turn fails
    typeAndSubmit("Can you make it cheaper?");
    await act(async () => {
      settleAsk?.({ ok: false, kind: "http", message: "boom" });
    });
    expect(
      await screen.findByText("Something went wrong on our side."),
    ).toBeInTheDocument();

    // Retry — must include the stored thread_id
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(3));
    expect(mockAsk.mock.calls[2]?.[0]).toEqual({
      question: "Can you make it cheaper?",
      thread_id: "thread-1",
    });
  });
});

describe("Chat lifecycle — MALFORMED-RESPONSE", () => {
  it("renders the malformed recovery block with verbatim copy and preserves the prompt", async () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    await act(async () => {
      settleAsk?.({ ok: false, kind: "malformed", message: "bad json" });
    });

    expect(
      await screen.findByText("We received a response we couldn't read."),
    ).toBeInTheDocument();
    // The prompt survives above the recovery block
    expect(inTranscript().getByText("A trip to Paris")).toBeInTheDocument();
    // Raw error never reaches the UI
    expect(screen.queryByText(/bad json/i)).not.toBeInTheDocument();
  });
});

describe("Chat lifecycle — DUPLICATE-SUBMISSION", () => {
  it("a second submit while waiting is a no-op — fake ask called exactly once", async () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    expect(
      await screen.findByText("Waynora is planning your trip"),
    ).toBeInTheDocument();

    // Attempt a second submit while waiting
    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "Another question" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });

    // The fake ask was called exactly once
    expect(mockAsk).toHaveBeenCalledTimes(1);
  });
});

describe("Chat lifecycle — TIMEOUT-COPY", () => {
  it("renders the timeout recovery block with the exact headline and server-continuation body", async () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    await act(async () => {
      settleAsk?.({ ok: false, kind: "timeout", message: "too slow" });
    });

    expect(
      await screen.findByText("This request took too long."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your trip may still be building on our side/,
      ),
    ).toBeInTheDocument();
  });
});

describe("Chat lifecycle — STOP-WAITING (CR-01 regression)", () => {
  it("Stop waiting aborts the controller's request and renders the aborted recovery copy", async () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Lisbon");
    expect(
      await screen.findByText("Waynora is planning your trip"),
    ).toBeInTheDocument();

    // Click Stop waiting — must reach the CONTROLLER's stop(), not the
    // DOM global window.stop() (which aborts nothing).
    fireEvent.click(screen.getByRole("button", { name: "Stop waiting" }));

    // The controller aborted the in-flight request's signal.
    const signal = mockAsk.mock.calls[0]?.[1] as AbortSignal | undefined;
    expect(signal?.aborted).toBe(true);

    // The pending ask settles the way askBackend does on abort.
    await act(async () => {
      settleAsk?.({ ok: false, kind: "abort", message: "stopped" });
    });

    // Aborted recovery copy (D-32 / WAIT-05) — the server may still run.
    expect(await screen.findByText("Waiting stopped.")).toBeInTheDocument();
    expect(
      screen.getByText(/Your trip may still be building on our side/),
    ).toBeInTheDocument();
    // The user's prompt is preserved above the recovery block.
    expect(inTranscript().getByText("A trip to Lisbon")).toBeInTheDocument();
  });
});

describe("Chat lifecycle — ELAPSED BASELINE (CR-02 regression)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("opens at 0:00 / band A even after a long idle period before submitting", () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );

    // Flush initial render
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Four minutes of idle reading before the user submits — this time
    // must NOT leak into the request's elapsed readout.
    act(() => {
      vi.advanceTimersByTime(240_000);
    });

    typeAndSubmit("A trip to Kyoto");

    // Flush the submit
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // The shell opens at 0:00 with band A copy — honest baseline.
    expect(
      screen.getByText("Waynora is planning your trip"),
    ).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByText("Reading your request.")).toBeInTheDocument();
    expect(screen.queryByText("4:00")).not.toBeInTheDocument();
  });
});
