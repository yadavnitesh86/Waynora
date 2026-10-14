import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Conversation } from "../lib/cookie/schema";

const { mockReadConversations, mockWriteConversations } = vi.hoisted(() => ({
  mockReadConversations: vi.fn(),
  mockWriteConversations: vi.fn(),
}));

/**
 * Only the cookie boundary is faked: the hook's sorting, selection,
 * auto-title derivation, and eviction reporting all run for real, the same
 * way `src/routes/Chat.test.tsx` fakes only `ask`.
 */
vi.mock("../lib/cookie/repository", () => ({
  readConversations: mockReadConversations,
  writeConversations: mockWriteConversations,
}));

import { useConversations } from "./useConversations";

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

/** The conversation array handed to the nth `writeConversations` call. */
function writtenConversations(call = 0): Conversation[] {
  return mockWriteConversations.mock.calls[call]?.[0] ?? [];
}

function writtenTitles(call = 0): string[] {
  return writtenConversations(call).map((conversation) => conversation.title);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  mockWriteConversations.mockReturnValue({
    conversations: [],
    recovered: false,
    evicted: [],
  });
});

describe("useConversations (load)", () => {
  it("loads the snapshot sorted newest first and activates the newest conversation", () => {
    const older = makeConversation({
      id: "conv-old",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    const newer = makeConversation({
      id: "33333333-3333-4333-8333-333333333333",
      updatedAt: "2026-01-02T00:00:00Z",
    });
    // Stored deliberately out of order: the hook sorts, it does not trust.
    stubSnapshot([older, newer]);

    const { result } = renderHook(() => useConversations());

    expect(result.current.conversations.map((c) => c.id)).toEqual([
      "33333333-3333-4333-8333-333333333333",
      "conv-old",
    ]);
    expect(result.current.activeId).toBe("33333333-3333-4333-8333-333333333333");
    expect(result.current.activeConversation?.id).toBe("33333333-3333-4333-8333-333333333333");
  });

  it("exposes the empty state when the snapshot has no conversations", () => {
    stubSnapshot([]);

    const { result } = renderHook(() => useConversations());

    expect(result.current.conversations).toEqual([]);
    expect(result.current.activeId).toBeNull();
    expect(result.current.activeConversation).toBeNull();
  });

  it("writes nothing on mount, so an empty snapshot never becomes cookie junk", () => {
    stubSnapshot([]);

    renderHook(() => useConversations());

    expect(mockWriteConversations).not.toHaveBeenCalled();
  });
});

describe("useConversations (create)", () => {
  it("creates an empty New chat, activates it, and persists the full list newest first", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-1111-4111-8111-111111111111");
    stubSnapshot([makeConversation({ id: "conv-old" })]);

    const { result } = renderHook(() => useConversations());

    let created: Conversation | undefined;
    act(() => {
      created = result.current.createConversation();
    });

    expect(created?.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(created?.title).toBe("New chat");
    expect(created?.messages).toEqual([]);
    expect(result.current.activeId).toBe("11111111-1111-4111-8111-111111111111");
    expect(result.current.conversations.map((c) => c.id)).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "conv-old",
    ]);
    expect(mockWriteConversations).toHaveBeenCalledTimes(1);
    expect(writtenConversations(0).map((c) => c.id)).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "conv-old",
    ]);
  });

  it("creates the first conversation from an empty snapshot and activates it", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("22222222-2222-4222-8222-222222222222");
    stubSnapshot([]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.createConversation();
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.activeId).toBe("22222222-2222-4222-8222-222222222222");
    expect(result.current.activeConversation?.title).toBe("New chat");
  });

  it("composes with syncConversation in the same tick: create, then add the first message", () => {
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("33333333-3333-4333-8333-333333333333")
      .mockReturnValueOnce("44444444-4444-4444-8444-444444444444");
    stubSnapshot([]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      const fresh = result.current.createConversation();
      result.current.syncConversation({
        ...fresh,
        messages: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            role: "user",
            content: "10 days in Japan in April",
            createdAt: "2026-01-03T00:00:00Z",
          },
        ],
        updatedAt: "2026-01-03T00:00:00Z",
      });
    });

    // Both mutations landed on the created conversation: the message is
    // there and the auto-title derived from it (PERSIST-07).
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.activeConversation?.messages).toHaveLength(1);
    expect(result.current.activeConversation?.title).toBe(
      "10 days in Japan in April",
    );
    // Two writes: create (default title), then the derived-title sync.
    expect(mockWriteConversations).toHaveBeenCalledTimes(2);
    expect(writtenTitles(1)).toEqual(["10 days in Japan in April"]);
  });
});

describe("useConversations (select)", () => {
  it("activates an existing conversation without writing to the repository", () => {
    stubSnapshot([
      makeConversation({ id: "conv-active", updatedAt: "2026-01-02T00:00:00Z" }),
      makeConversation({ id: "conv-other", updatedAt: "2026-01-01T00:00:00Z" }),
    ]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.selectConversation("conv-other");
    });

    expect(result.current.activeId).toBe("conv-other");
    expect(result.current.activeConversation?.id).toBe("conv-other");
    // Selection is UI state, not conversation data.
    expect(mockWriteConversations).not.toHaveBeenCalled();
  });

  it("ignores an unknown id", () => {
    stubSnapshot([makeConversation({ id: "conv-active" })]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.selectConversation("conv-does-not-exist");
    });

    expect(result.current.activeId).toBe("conv-active");
    expect(mockWriteConversations).not.toHaveBeenCalled();
  });
});

describe("useConversations (rename)", () => {
  it("trims the new title, persists it, and moves the renamed conversation to the top", () => {
    const older = makeConversation({
      id: "conv-old",
      title: "Old chat",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    const newer = makeConversation({
      id: "33333333-3333-4333-8333-333333333333",
      updatedAt: "2026-01-05T00:00:00Z",
    });
    stubSnapshot([newer, older]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.renameConversation("conv-old", "  Japan trip  ");
    });

    expect(result.current.activeConversation?.title).toBe("New chat");
    const renamed = result.current.conversations.find(
      (c) => c.id === "conv-old",
    );
    expect(renamed?.title).toBe("Japan trip");
    expect(renamed?.updatedAt).not.toBe("2026-01-01T00:00:00Z");
    // A rename is a touch: retention order puts it first (D-20).
    expect(result.current.conversations[0]?.id).toBe("conv-old");
    expect(mockWriteConversations).toHaveBeenCalledTimes(1);
    expect(writtenConversations(0).map((c) => c.id)).toEqual([
      "conv-old",
      "33333333-3333-4333-8333-333333333333",
    ]);
  });

  it("rejects a blank title and writes nothing", () => {
    stubSnapshot([makeConversation({ id: "conv-1", title: "Japan trip" })]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.renameConversation("conv-1", "   ");
    });

    expect(result.current.conversations[0]?.title).toBe("Japan trip");
    expect(mockWriteConversations).not.toHaveBeenCalled();
  });

  it("ignores an unknown id and an unchanged title", () => {
    stubSnapshot([makeConversation({ id: "conv-1", title: "Japan trip" })]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.renameConversation("conv-1", "Japan trip");
      result.current.renameConversation("conv-missing", "Whatever");
    });

    expect(result.current.conversations[0]?.title).toBe("Japan trip");
    expect(mockWriteConversations).not.toHaveBeenCalled();
  });
});

describe("useConversations (delete)", () => {
  it("removes a non-active conversation and keeps the active selection", () => {
    stubSnapshot([
      makeConversation({ id: "conv-active", updatedAt: "2026-01-03T00:00:00Z" }),
      makeConversation({ id: "conv-other", updatedAt: "2026-01-01T00:00:00Z" }),
    ]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.deleteConversation("conv-other");
    });

    expect(result.current.conversations.map((c) => c.id)).toEqual([
      "conv-active",
    ]);
    expect(result.current.activeId).toBe("conv-active");
    expect(mockWriteConversations).toHaveBeenCalledTimes(1);
  });

  it("deleting the active conversation activates the next most recent survivor", () => {
    stubSnapshot([
      makeConversation({ id: "conv-a", updatedAt: "2026-01-03T00:00:00Z" }),
      makeConversation({ id: "conv-b", updatedAt: "2026-01-02T00:00:00Z" }),
      makeConversation({ id: "conv-c", updatedAt: "2026-01-01T00:00:00Z" }),
    ]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.deleteConversation("conv-a");
    });

    expect(result.current.conversations.map((c) => c.id)).toEqual([
      "conv-b",
      "conv-c",
    ]);
    expect(result.current.activeId).toBe("conv-b");
    expect(result.current.activeConversation?.id).toBe("conv-b");
  });

  it("deleting the only conversation resets to the empty state", () => {
    stubSnapshot([makeConversation({ id: "conv-only" })]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.deleteConversation("conv-only");
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.activeId).toBeNull();
    expect(result.current.activeConversation).toBeNull();
  });

  it("ignores an unknown id", () => {
    stubSnapshot([makeConversation({ id: "conv-1" })]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.deleteConversation("conv-missing");
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(mockWriteConversations).not.toHaveBeenCalled();
  });
});

describe("useConversations (sync)", () => {
  it("derives the auto-title from the first user message and moves the conversation to the top", () => {
    const other = makeConversation({
      id: "conv-other",
      updatedAt: "2026-01-02T00:00:00Z",
    });
    const first = makeConversation({
      id: "22222222-2222-4222-8222-222222222222",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    stubSnapshot([other, first]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.syncConversation({
        ...first,
        messages: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            role: "user",
            content: "10 days in Japan in April",
            createdAt: "2026-01-03T00:00:00Z",
          },
        ],
        updatedAt: "2026-01-03T00:00:00Z",
      });
    });

    // PERSIST-07: the title comes from the first user message.
    expect(result.current.conversations[0]?.title).toBe(
      "10 days in Japan in April",
    );
    // Retention order: the synced conversation is now the newest.
    expect(result.current.conversations[0]?.id).toBe("22222222-2222-4222-8222-222222222222");
    expect(writtenTitles(0)).toEqual([
      "10 days in Japan in April",
      "New chat",
    ]);
  });

  it("derives the title once: a second turn does not re-title the conversation", () => {
    const conv = makeConversation({
      id: "conv-1",
      title: "10 days in Japan in April",
      messages: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          role: "user",
          content: "10 days in Japan in April",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      updatedAt: "2026-01-01T00:00:00Z",
    });
    stubSnapshot([conv]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.syncConversation({
        ...conv,
        messages: [
          ...conv.messages,
          {
            id: "msg-2",
            role: "user",
            content: "Can you make it cheaper?",
            createdAt: "2026-01-02T00:00:00Z",
          },
        ],
        updatedAt: "2026-01-02T00:00:00Z",
      });
    });

    expect(result.current.conversations[0]?.title).toBe(
      "10 days in Japan in April",
    );
  });

  it("never overwrites a title the user renamed (D-26)", () => {
    const conv = makeConversation({
      id: "conv-1",
      title: "Japan with the kids",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    stubSnapshot([conv]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.syncConversation({
        ...conv,
        messages: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            role: "user",
            content: "10 days in Japan in April",
            createdAt: "2026-01-02T00:00:00Z",
          },
        ],
        updatedAt: "2026-01-02T00:00:00Z",
      });
    });

    expect(result.current.conversations[0]?.title).toBe("Japan with the kids");
  });

  it("keeps the default title while the conversation still has no user message", () => {
    const conv = makeConversation({ id: "conv-1" });
    stubSnapshot([conv]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.syncConversation({ ...conv, updatedAt: "2026-01-02T00:00:00Z" });
    });

    expect(result.current.conversations[0]?.title).toBe("New chat");
  });

  it("ignores an unknown conversation id: a late sync cannot resurrect a deleted chat", () => {
    stubSnapshot([makeConversation({ id: "conv-1" })]);

    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.deleteConversation("conv-1");
      result.current.syncConversation(
        makeConversation({ id: "conv-1", title: "Zombie" }),
      );
    });

    expect(result.current.conversations).toEqual([]);
    expect(mockWriteConversations).toHaveBeenCalledTimes(1);
  });
});

describe("useConversations (retention reporting)", () => {
  it("surfaces evicted ids from the most recent write and resets when a later write evicts nothing", () => {
    stubSnapshot([
      makeConversation({ id: "conv-a", updatedAt: "2026-01-02T00:00:00Z" }),
      makeConversation({ id: "conv-b", updatedAt: "2026-01-01T00:00:00Z" }),
    ]);

    const { result } = renderHook(() => useConversations());

    mockWriteConversations.mockReturnValueOnce({
      conversations: [],
      recovered: false,
      evicted: ["conv-a"],
    });
    act(() => {
      result.current.renameConversation("conv-a", "Evicted chat");
    });
    expect(result.current.evictedIds).toEqual(["conv-a"]);

    act(() => {
      result.current.renameConversation("conv-b", "Kept chat");
    });
    expect(result.current.evictedIds).toEqual([]);
  });
});
