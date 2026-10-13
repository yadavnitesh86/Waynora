import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Conversation } from "../lib/cookie/schema";
import type { AskResult } from "../lib/errors";

const { mockAsk, mockReadConversations, mockWriteConversations } = vi.hoisted(
  () => ({
    mockAsk: vi.fn(),
    mockReadConversations: vi.fn(),
    mockWriteConversations: vi.fn(),
  }),
);

/**
 * Only the network boundary is faked: the real `useAskController` and the real
 * request controller run underneath, so every test drives
 * idle -> submitting -> waiting -> succeeded/failed exactly as the app does.
 * That is what makes the success/failure/retry assertions meaningful rather
 * than an echo of the mock.
 */
vi.mock("../lib/api/ask", () => ({ askBackend: mockAsk }));

vi.mock("../lib/cookie/repository", () => ({
  readConversations: mockReadConversations,
  writeConversations: mockWriteConversations,
}));

import Chat from "./Chat";
import { expectNoAxeViolations } from "../test/axe";

/** Settles the in-flight ask by hand so the test picks the outcome. */
let settleAsk: ((result: AskResult) => void) | null = null;

const ANSWER = "## Your Japan itinerary\n\nDay one in Kyoto.";

function makeConversation(
  overrides: Partial<Conversation> = {},
): Conversation {
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

/** The most recent conversation handed to `writeConversations`. */
function lastWrittenConversation(): Conversation | undefined {
  const calls = mockWriteConversations.mock.calls;
  return calls[calls.length - 1]?.[0]?.[0];
}

/** The `{ question, thread_id }` payload of the nth ask call. */
function askPayload(call: number) {
  return mockAsk.mock.calls[call]?.[0];
}

function typeAndSubmit(text: string) {
  const textarea = screen.getByLabelText("Your trip request");
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });
  return textarea;
}

/**
 * The route `<h1>` mirrors the derived title, which is the first user message.
 * Message lookups therefore have to happen inside the conversation list, or
 * they match the heading too.
 */
function inTranscript() {
  return within(screen.getByRole("list", { name: "Conversation" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  settleAsk = null;
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
  // axe-core's html-has-lang rule needs a document language.
  document.documentElement.setAttribute("lang", "en");
});

describe("Chat route (first submit slice)", () => {
  it("renders EmptyState with C-16/C-17 and no action when there are no messages", async () => {
    render(<Chat />);

    expect(
      await screen.findByText("Where do you want to go?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Describe your trip in your own words. A real agent builds the plan, usually in 5 to 15 minutes. Your chat stays in this browser.",
      ),
    ).toBeInTheDocument();
    // C-18: no second CTA. The composer below is the only action.
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });

  it("shows the user message immediately on submit with markInFlight metadata", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("10 days in Japan in April");

    // CHAT-03: visible before any backend response.
    expect(
      await inTranscript().findByText("10 days in Japan in April"),
    ).toBeInTheDocument();

    const userMsg = lastWrittenConversation()?.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMsg?.content).toBe("10 days in Japan in April");
    expect(userMsg?.metadata?.inFlight).toBe(true);
  });

  it("clears the draft and retains focus in the textarea after submit", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "A trip to Paris" } });
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: false,
    });

    expect(textarea).toHaveValue("");
    expect(document.activeElement).toBe(textarea);
  });

  it("shows StorageNotice when writeConversations evicts the active conversation", async () => {
    mockWriteConversations.mockImplementation(() => ({
      conversations: [],
      recovered: false,
      evicted: ["conv-1"],
    }));

    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");

    expect(
      await screen.findByText("This chat couldn't be saved."),
    ).toBeInTheDocument();
    // D-20: persistence failure never blocks or cancels the request.
    expect(mockAsk).toHaveBeenCalledTimes(1);
  });

  it("includes thread_id only when the conversation already has a threadId", async () => {
    stubSnapshot([
      makeConversation({ threadId: "thread-from-prior-turn" }),
    ]);

    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("Follow-up question");

    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(1));
    expect(askPayload(0)).toEqual({
      question: "Follow-up question",
      thread_id: "thread-from-prior-turn",
    });
  });

  it("omits thread_id on first turn when the conversation has no threadId", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("First message");

    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(1));
    expect(askPayload(0)).toEqual({
      question: "First message",
      thread_id: undefined,
    });
  });
});

describe("Chat route (answers, failures, and retry)", () => {
  it("appends the validated answer through Markdown and stores the returned threadId", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("10 days in Japan in April");

    await act(async () => {
      settleAsk?.({ ok: true, answer: ANSWER, threadId: "thread-returned-1" });
    });

    // CHAT-06: the answer renders through the unchanged safe Markdown
    // component, as real markdown structure rather than raw text.
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Your Japan itinerary",
      }),
    ).toBeInTheDocument();

    // CHAT-05: the returned thread_id is stored on the conversation.
    const written = lastWrittenConversation();
    expect(written?.threadId).toBe("thread-returned-1");

    // D-27: the in-flight flag cleared now that a real answer exists.
    const userMsg = written?.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMsg?.metadata?.inFlight).toBe(false);
  });

  it("reuses the stored thread_id for a follow-up submit", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("10 days in Japan in April");
    await act(async () => {
      settleAsk?.({ ok: true, answer: ANSWER, threadId: "thread-returned-1" });
    });
    await screen.findByRole("heading", {
      level: 2,
      name: "Your Japan itinerary",
    });

    typeAndSubmit("Can you make it cheaper?");

    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(2));
    expect(askPayload(1)).toEqual({
      question: "Can you make it cheaper?",
      thread_id: "thread-returned-1",
    });
  });

  it("marks metadata.error with the failure kind and preserves the prompt (PERSIST-09)", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");

    await act(async () => {
      settleAsk?.({ ok: false, kind: "network", message: "fetch failed" });
    });

    // WAIT-05: the verbatim recovery headline for the kind.
    expect(
      await screen.findByText("We couldn't reach the server."),
    ).toBeInTheDocument();
    // PERSIST-09: the prompt and history stay untouched.
    expect(inTranscript().getByText("A trip to Paris")).toBeInTheDocument();
    // QUAL-01: the raw provider message never reaches the UI.
    expect(screen.queryByText(/fetch failed/i)).not.toBeInTheDocument();

    const userMsg = lastWrittenConversation()?.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMsg?.metadata?.error).toBe("network");
    expect(userMsg?.content).toBe("A trip to Paris");
  });

  it("retries with the identical question and no thread_id when none is known", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    await act(async () => {
      settleAsk?.({ ok: false, kind: "http", message: "boom" });
    });

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(2));
    expect(askPayload(1)).toEqual({
      question: "A trip to Paris",
      thread_id: undefined,
    });

    // The stale recovery block clears while the retry is in flight...
    await waitFor(() => {
      expect(
        screen.queryByText("Something went wrong on our side."),
      ).not.toBeInTheDocument();
    });
    // ...and the identical message shows the in-flight footer instead.
    expect(inTranscript().getByText("Waiting for your plan")).toBeInTheDocument();
    expect(inTranscript().getByText("A trip to Paris")).toBeInTheDocument();
  });

  it("retries with the stored thread_id when one is already known (D-35)", async () => {
    stubSnapshot([makeConversation({ threadId: "thread-known" })]);
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    await act(async () => {
      settleAsk?.({ ok: false, kind: "timeout", message: "too slow" });
    });

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(2));
    expect(askPayload(1)).toEqual({
      question: "A trip to Paris",
      thread_id: "thread-known",
    });
  });

  it("renders the reload-recovery block for a persisted in-flight message and replays nothing (PERSIST-10)", async () => {
    stubSnapshot([
      makeConversation({
        messages: [
          {
            id: "msg-persisted",
            role: "user",
            content: "A trip left running",
            createdAt: "2026-01-01T00:00:00Z",
            metadata: { inFlight: true },
          },
        ],
      }),
    ]);

    render(<Chat />);

    // The prompt survives and the honest block explains nothing restarted.
    expect(await screen.findByText("A trip left running")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This request was still running when you left.",
    );
    // D-27: never auto-replayed — no request is dispatched at load.
    expect(mockAsk).not.toHaveBeenCalled();
  });

  it("renders a hostile Markdown answer inert (CHAT-06, T-03-07)", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("Show me something hostile");

    await act(async () => {
      settleAsk?.({
        ok: true,
        answer: [
          '<script>window.__pwned = true</script>',
          "",
          "[click](javascript:alert(1))",
          "",
          '<img src=x onerror="window.__pwned = true" />',
        ].join("\n"),
        threadId: "thread-hostile",
      });
    });

    // The answer reached the transcript through the safe renderer.
    await screen.findByText("click");

    // No script element and no javascript: href survive in the DOM.
    expect(container.querySelector("script")).toBeNull();
    expect(
      Array.from(container.querySelectorAll("a")).some((anchor) =>
        (anchor.getAttribute("href") ?? "").startsWith("javascript:"),
      ),
    ).toBe(false);
    // Nothing executed.
    expect(
      (window as unknown as { __pwned?: boolean }).__pwned,
    ).toBeUndefined();
  });
});

describe("Chat route document metadata (C-01, C-02, C-03)", () => {
  it("titles the document with the conversation title and writes the C-02 meta description", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    // D-26 / C-01: "New chat" before the first user message.
    expect(document.title).toBe("New chat · Waynora");
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe("Your trip planning chat");
  });

  it("shows New chat as the route h1 before the first message", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "New chat",
    );
  });

  it("derives the document title and the h1 from the first user message", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("10 days in Japan in April");

    expect(
      await inTranscript().findByText("10 days in Japan in April"),
    ).toBeInTheDocument();

    expect(document.title).toBe("10 days in Japan in April · Waynora");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "10 days in Japan in April",
    );
  });
});

describe("Chat route accessibility", () => {
  it("has no critical or serious axe violations on the empty state", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Where do you want to go?");

    await expectNoAxeViolations(container);
  });

  it("has no critical or serious axe violations with a recovery block in the transcript", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    await act(async () => {
      settleAsk?.({ ok: false, kind: "network", message: "down" });
    });
    expect(
      await screen.findByText("We couldn't reach the server."),
    ).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it("has no critical or serious axe violations while the composer is busy", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    expect(
      await screen.findByText(
        "A request is already running. Your text stays here until it finishes.",
      ),
    ).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });
});
