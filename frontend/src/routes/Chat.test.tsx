import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Conversation } from "../lib/cookie/schema";

const { mockSubmit, mockStatus, mockStop } = vi.hoisted(() => ({
  mockSubmit: vi.fn(),
  mockStatus: { kind: "idle" as const },
  mockStop: vi.fn(),
}));

vi.mock("../hooks/useAskController", () => ({
  useAskController: () => ({
    status: mockStatus,
    submit: mockSubmit,
    stop: mockStop,
  }),
}));

const mockReadConversations = vi.fn();
const mockWriteConversations = vi.fn();

vi.mock("../lib/cookie/repository", () => ({
  readConversations: mockReadConversations,
  writeConversations: mockWriteConversations,
}));

import Chat from "./Chat";

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

describe("Chat route (first submit slice)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadConversations.mockReturnValue({
      conversations: [],
      recovered: false,
      evicted: [],
    });
    mockWriteConversations.mockReturnValue({
      conversations: [],
      recovered: false,
      evicted: [],
    });
  });

  it("renders EmptyState with C-16/C-17 and no action when there are no messages", async () => {
    mockReadConversations.mockReturnValue({
      conversations: [makeConversation()],
      recovered: false,
      evicted: [],
    });
    render(<Chat />);

    expect(
      await screen.findByText("Where do you want to go?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Describe your trip in your own words. A real agent builds the plan, usually in 5 to 15 minutes. Your chat stays in this browser.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the user message immediately on submit with markInFlight metadata", async () => {
    mockReadConversations.mockReturnValue({
      conversations: [makeConversation()],
      recovered: false,
      evicted: [],
    });
    mockWriteConversations.mockReturnValue({
      conversations: [],
      recovered: false,
      evicted: [],
    });

    render(<Chat />);

    // Wait for the conversation to load
    await screen.findByText("Where do you want to go?");

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "10 days in Japan in April" } });
    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: false,
    });

    // The user message appears immediately in the transcript
    expect(
      await screen.findByText("10 days in Japan in April"),
    ).toBeInTheDocument();

    // writeConversations was called with a conversation that has the
    // in-flight message
    expect(mockWriteConversations).toHaveBeenCalled();
    const writtenConv = mockWriteConversations.mock.calls[0][0][0];
    const userMsg = writtenConv.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMsg).toBeDefined();
    expect(userMsg.content).toBe("10 days in Japan in April");
    expect(userMsg.metadata.inFlight).toBe(true);
  });

  it("clears the draft and retains focus in the textarea after submit", async () => {
    mockReadConversations.mockReturnValue({
      conversations: [makeConversation()],
      recovered: false,
      evicted: [],
    });

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

    // Draft is cleared
    expect(textarea).toHaveValue("");
    // Focus stays in the textarea
    expect(document.activeElement).toBe(textarea);
  });

  it("shows StorageNotice when writeConversations evicts the active conversation", async () => {
    mockReadConversations.mockReturnValue({
      conversations: [makeConversation()],
      recovered: false,
      evicted: [],
    });
    mockWriteConversations.mockReturnValue({
      conversations: [],
      recovered: false,
      evicted: ["conv-1"],
    });

    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "A trip to Paris" } });
    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: false,
    });

    // StorageNotice is visible
    expect(
      await screen.findByText("This chat couldn't be saved."),
    ).toBeInTheDocument();
    // Submit still proceeded — controller.submit was called
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("includes thread_id only when the conversation already has a threadId", async () => {
    mockReadConversations.mockReturnValue({
      conversations: [
        makeConversation({ threadId: "thread-from-prior-turn" }),
      ],
      recovered: false,
      evicted: [],
    });

    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "Follow-up question" } });
    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: false,
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    const call = mockSubmit.mock.calls[0][0];
    expect(call.threadId).toBe("thread-from-prior-turn");
  });

  it("omits thread_id on first turn when the conversation has no threadId", async () => {
    mockReadConversations.mockReturnValue({
      conversations: [makeConversation()],
      recovered: false,
      evicted: [],
    });

    render(<Chat />);
    await screen.findByText("Where do you want to go?");

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "First message" } });
    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: false,
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    const call = mockSubmit.mock.calls[0][0];
    expect(call.threadId).toBeUndefined();
  });
});
