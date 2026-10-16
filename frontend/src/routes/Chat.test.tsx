import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

/**
 * A reload-faithful fake of the cookie repository: reads hand back
 * whatever the last write stored, so unmounting and re-rendering the
 * route is a genuine simulated reload for the persistence assertions
 * (PERSIST-08).
 *
 * The implementations are (re)applied in `beforeEach`, because a per-test
 * override (the eviction case) would otherwise outlive its test — and a
 * test that stops writing through to the store would silently break every
 * later reload assertion.
 */
const store = { conversations: [] as Conversation[] };
const readImpl = () => ({
  conversations: store.conversations,
  recovered: false,
  evicted: [],
});
const writeImpl = (conversations: Conversation[]) => {
  store.conversations = conversations;
  return { conversations, recovered: false, evicted: [] };
};

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

function userMessage(id: string, content: string) {
  return {
    id,
    role: "user" as const,
    content,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

function stubSnapshot(conversations: Conversation[]) {
  store.conversations = conversations;
}

/** The most recent conversation handed to `writeConversations`. */
function lastWrittenConversation(): Conversation | undefined {
  const calls = mockWriteConversations.mock.calls;
  return calls[calls.length - 1]?.[0]?.[0];
}

/** The full newest-first list handed to the most recent write. */
function lastWrittenConversations(): Conversation[] {
  const calls = mockWriteConversations.mock.calls;
  return calls[calls.length - 1]?.[0] ?? [];
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

/** The history sidebar, so title lookups never collide with the h1. */
function sidebar() {
  return within(screen.getByRole("navigation", { name: "Chat history" }));
}

/** Clicks a conversation row in the sidebar, addressed by its title. */
function selectConversationInSidebar(title: string) {
  fireEvent.click(sidebar().getByText(title).closest("button") as HTMLElement);
}

afterEach(() => {
  // Undo per-test overrides (including `crypto.randomUUID` spies) so no
  // test leaks an implementation into the next one.
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  settleAsk = null;
  mockAsk.mockImplementation(
    () =>
      new Promise<AskResult>((resolve) => {
        settleAsk = resolve;
      }),
  );
  mockReadConversations.mockImplementation(readImpl);
  mockWriteConversations.mockImplementation(writeImpl);
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
        "Describe your trip in your own words. A real agent builds the plan, usually in 15 to 20 minutes. Your chat stays in this browser.",
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
    // ...and the identical message shows its waiting state — the elapsed
    // timer and stop control that now live inside the request's own bubble.
    expect(
      inTranscript().getByText("Plans usually take 15 to 20 minutes."),
    ).toBeInTheDocument();
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

describe("Chat route (multi-conversation management)", () => {
  it("renders the history sidebar with its trigger and primary action", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    expect(
      screen.getByRole("navigation", { name: "Chat history" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open chat history" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New chat" })).toBeInTheDocument();
  });

  it("switches conversations and updates the rendered thread and h1", async () => {
    stubSnapshot([
      makeConversation({
        id: "conv-japan",
        title: "Japan plan",
        messages: [userMessage("msg-japan", "Japan itinerary please")],
      }),
      makeConversation({
        id: "conv-paris",
        title: "Paris plan",
        messages: [userMessage("msg-paris", "Paris itinerary please")],
      }),
    ]);

    render(<Chat />);
    expect(
      await screen.findByText("Japan itinerary please"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Paris itinerary please")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Japan plan",
    );

    selectConversationInSidebar("Paris plan");

    expect(
      await screen.findByText("Paris itinerary please"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Japan itinerary please")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Paris plan",
    );
  });

  it("creates a new chat and resets the thread to the empty composer state", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "55555555-5555-4555-8555-555555555555",
    );
    stubSnapshot([
      makeConversation({
        id: "conv-japan",
        title: "Japan plan",
        messages: [userMessage("msg-japan", "Japan itinerary please")],
      }),
    ]);

    render(<Chat />);
    await screen.findByText("Japan itinerary please");

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));

    expect(
      await screen.findByText("Where do you want to go?"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Japan itinerary please")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "New chat",
    );
    // The new chat persisted at the head of the list, newest first.
    expect(lastWrittenConversations().map((c) => c.id)).toEqual([
      "55555555-5555-4555-8555-555555555555",
      "conv-japan",
    ]);
    // No request was dispatched by creating a chat.
    expect(mockAsk).not.toHaveBeenCalled();
  });

  it("persists a rename across a simulated reload", async () => {
    stubSnapshot([
      makeConversation({ id: "conv-1", title: "New chat", messages: [] }),
    ]);

    const view = render(<Chat />);
    await screen.findByText("Where do you want to go?");

    fireEvent.click(
      sidebar().getByRole("button", { name: "Rename New chat" }),
    );
    fireEvent.change(screen.getByLabelText("Chat title"), {
      target: { value: "Japan with the kids" },
    });
    fireEvent.submit(screen.getByLabelText("Chat title").closest("form")!);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Japan with the kids",
    );

    // Simulated reload: the fresh mount reads what the last write stored.
    view.unmount();
    render(<Chat />);

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Japan with the kids",
    );
    expect(
      screen.getByRole("button", { name: "Rename Japan with the kids" }),
    ).toBeInTheDocument();
    expect(lastWrittenConversations()[0]?.title).toBe(
      "Japan with the kids",
    );
  });

  it("deletes the active conversation, moves the selection, and persists it across a reload", async () => {
    stubSnapshot([
      makeConversation({
        id: "conv-japan",
        title: "Japan plan",
        messages: [userMessage("msg-japan", "Japan itinerary please")],
      }),
      makeConversation({
        id: "conv-paris",
        title: "Paris plan",
        messages: [userMessage("msg-paris", "Paris itinerary please")],
      }),
    ]);

    const view = render(<Chat />);
    await screen.findByText("Japan itinerary please");

    fireEvent.click(
      sidebar().getByRole("button", { name: "Delete Japan plan" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    // The selection moved to the next most recent conversation.
    expect(
      await screen.findByText("Paris itinerary please"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Japan itinerary please")).not.toBeInTheDocument();
    expect(lastWrittenConversations().map((c) => c.id)).toEqual(["conv-paris"]);

    view.unmount();
    render(<Chat />);

    expect(
      await screen.findByText("Paris itinerary please"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Japan plan" }),
    ).not.toBeInTheDocument();
  });

  it("creates its first conversation on the first submit of an empty history", async () => {
    stubSnapshot([]);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "66666666-6666-4666-8666-666666666666",
    );

    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("10 days in Japan in April");

    // The deferred dispatch still fired exactly once, against the
    // conversation that was created in the same tick.
    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(1));
    expect(askPayload(0)).toEqual({
      question: "10 days in Japan in April",
      thread_id: undefined,
    });
    expect(
      await inTranscript().findByText("10 days in Japan in April"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "10 days in Japan in April",
    );

    // The answer still lands on the created conversation.
    await act(async () => {
      settleAsk?.({ ok: true, answer: ANSWER, threadId: "thread-empty-1" });
    });
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Your Japan itinerary",
      }),
    ).toBeInTheDocument();
    expect(lastWrittenConversations()[0]?.title).toBe(
      "10 days in Japan in April",
    );
    expect(lastWrittenConversations()[0]?.threadId).toBe("thread-empty-1");
  });

  it("aborts the in-flight request on switch and drops its late result", async () => {
    stubSnapshot([
      makeConversation({
        id: "conv-japan",
        title: "Japan plan",
        messages: [],
      }),
      makeConversation({
        id: "conv-paris",
        title: "Paris plan",
        messages: [],
      }),
    ]);

    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A long question about Japan");
    await waitFor(() => expect(mockAsk).toHaveBeenCalledTimes(1));
    const firstSignal = mockAsk.mock.calls[0]?.[1];

    selectConversationInSidebar("Paris plan");

    // WAIT-06: the conversation switch disposed the old controller, so the
    // in-flight request was aborted and the waiting UI is gone.
    expect(firstSignal?.aborted).toBe(true);
    expect(
      await screen.findByText("Where do you want to go?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "A request is already running. Your text stays here until it finishes.",
      ),
    ).not.toBeInTheDocument();

    // The late answer never reaches the newly selected conversation.
    await act(async () => {
      settleAsk?.({ ok: true, answer: "A late answer", threadId: "thread-late" });
    });
    expect(screen.queryByText("A late answer")).not.toBeInTheDocument();
    expect(mockAsk).toHaveBeenCalledTimes(1);
  });
});

describe("Chat route waiting game integration (GAME-01, GAME-06)", () => {
  it("shows the 2048 board only while the request is actively waiting and unmounts it cleanly on success", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");
    // Nothing is waiting yet — no board (GAME-01).
    expect(
      screen.queryByRole("grid", { name: "2048 game board" }),
    ).not.toBeInTheDocument();

    typeAndSubmit("10 days in Japan in April");
    expect(
      await screen.findByRole("grid", { name: "2048 game board" }),
    ).toBeInTheDocument();

    await act(async () => {
      settleAsk?.({ ok: true, answer: ANSWER, threadId: "thread-game-1" });
    });

    // The terminal status unmounts the shell — board gone, answer and
    // prompt intact, nothing corrupted by the transition.
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Your Japan itinerary",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("grid", { name: "2048 game board" }),
    ).not.toBeInTheDocument();
    expect(
      inTranscript().getByText("10 days in Japan in April"),
    ).toBeInTheDocument();
  });

  it("unmounts the board when Stop waiting aborts the request", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("A trip to Paris");
    // The controller has already moved on to `waiting` (the ask promise is
    // pending), so the board is up.
    expect(
      await screen.findByRole("grid", { name: "2048 game board" }),
    ).toBeInTheDocument();

    // GAME-06: stop aborts the request and the game leaves with the shell.
    fireEvent.click(screen.getByRole("button", { name: "Stop waiting" }));
    const signal = mockAsk.mock.calls[0]?.[1];
    expect(signal?.aborted).toBe(true);

    await act(async () => {
      settleAsk?.({ ok: false, kind: "abort", message: "stopped" });
    });
    expect(await screen.findByText("Waiting stopped.")).toBeInTheDocument();
    expect(
      screen.queryByRole("grid", { name: "2048 game board" }),
    ).not.toBeInTheDocument();
  });

  it("game moves never submit a chat message or abort the in-flight request", async () => {
    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("10 days in Japan in April");
    const board = await screen.findByRole("grid", {
      name: "2048 game board",
    });

    fireEvent.keyDown(board, { key: "ArrowLeft" });
    fireEvent.keyDown(board, { key: "ArrowUp" });
    fireEvent.keyDown(board, { key: "ArrowRight" });

    // Exactly one ask, still in flight, shell still up: playing changed
    // nothing about the request lifecycle.
    expect(mockAsk).toHaveBeenCalledTimes(1);
    expect(mockAsk.mock.calls[0]?.[1]?.aborted).toBe(false);
    expect(screen.getByRole("button", { name: "Stop waiting" })).toBeInTheDocument();

    await act(async () => {
      settleAsk?.({ ok: true, answer: ANSWER, threadId: "thread-game-2" });
    });
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Your Japan itinerary",
      }),
    ).toBeInTheDocument();
  });

  it("has no critical or serious axe violations in the waiting room with the 2048 board mounted", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Where do you want to go?");

    typeAndSubmit("10 days in Japan in April");
    expect(
      await screen.findByRole("grid", { name: "2048 game board" }),
    ).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });
});
