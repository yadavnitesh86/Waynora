// @vitest-environment node
// The domain operations are pure functions (D-29): no DOM, no
// browser globals, so the node environment is the correct — and
// lighter — place to run them. The persistence-boundary tests
// below stub `document` explicitly, which works in node too.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  addMessage,
  createConversation,
  createMessage,
  deriveTitle,
  markError,
  markInFlight,
  updateMessage,
} from "./domain";
import { readConversations, writeConversations } from "../cookie/repository";
import { enforceCap } from "../cookie/retention";
import { CUSTOMER_MESSAGES } from "../errors";

vi.mock("../env", () => ({
  env: {
    VITE_API_BASE_URL: "http://localhost:8000",
    VITE_CONVEX_URL: "https://example.convex.cloud",
  },
  envError: [],
  isDev: false,
}));

const NOW = "2026-01-01T00:00:00Z";
const LATER = "2026-01-02T00:00:00Z";

describe("chat domain operations", () => {
  describe("createConversation", () => {
    it("returns a new conversation titled New chat with no messages", () => {
      expect(createConversation("c1", NOW)).toEqual({
        id: "c1",
        title: "New chat",
        createdAt: NOW,
        updatedAt: NOW,
        messages: [],
      });
    });

    it("returns fresh objects rather than shared references", () => {
      const first = createConversation("c1", NOW);
      const second = createConversation("c1", NOW);

      expect(first).not.toBe(second);
      expect(first.messages).not.toBe(second.messages);
    });
  });

  describe("createMessage", () => {
    it("returns a message with no metadata", () => {
      expect(createMessage("m1", "user", "Plan a trip", NOW)).toEqual({
        id: "m1",
        role: "user",
        content: "Plan a trip",
        createdAt: NOW,
      });
    });

    it("supports the assistant role", () => {
      const message = createMessage(
        "m2",
        "assistant",
        "Here is your plan",
        NOW,
      );

      expect(message.role).toBe("assistant");
      expect(message.metadata).toBeUndefined();
    });
  });

  describe("addMessage", () => {
    it("appends the message and advances updatedAt to its createdAt", () => {
      const conversation = createConversation("c1", NOW);
      const message = createMessage("m1", "user", "Plan a trip", LATER);

      const result = addMessage(conversation, message);

      expect(result.messages).toEqual([message]);
      expect(result.updatedAt).toBe(LATER);
      expect(result.createdAt).toBe(NOW);
    });

    it("appends after existing messages", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", LATER),
      );
      const reply = createMessage(
        "m2",
        "assistant",
        "Here it is",
        "2026-01-03T00:00:00Z",
      );

      const result = addMessage(conversation, reply);

      expect(result.messages.map((message) => message.id)).toEqual([
        "m1",
        "m2",
      ]);
      expect(result.updatedAt).toBe(reply.createdAt);
    });

    it("does not mutate the original conversation", () => {
      const conversation = createConversation("c1", NOW);
      const message = createMessage("m1", "user", "Plan a trip", LATER);

      const result = addMessage(conversation, message);

      expect(conversation).not.toBe(result);
      expect(conversation.messages).not.toBe(result.messages);
      expect(conversation.messages).toEqual([]);
      expect(conversation.updatedAt).toBe(NOW);
    });
  });

  describe("updateMessage", () => {
    it("patches the matching message", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      );

      const result = updateMessage(conversation, "m1", {
        content: "Plan a trip to Japan",
      });

      expect(result.messages[0]!.content).toBe("Plan a trip to Japan");
    });

    it("leaves messages with other ids untouched", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      );

      const result = updateMessage(conversation, "missing", {
        content: "nope",
      });

      expect(result.messages).toEqual(conversation.messages);
    });

    it("does not mutate the original message", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      );

      const result = updateMessage(conversation, "m1", {
        content: "Plan a trip to Japan",
      });

      expect(conversation.messages[0]!.content).toBe("Plan a trip");
      expect(result.messages[0]).not.toBe(conversation.messages[0]);
    });
  });

  describe("deriveTitle", () => {
    it("uses the first user message content", () => {
      const messages = [
        createMessage("m1", "user", "Plan a trip to Japan", NOW),
      ];

      expect(deriveTitle(messages)).toBe("Plan a trip to Japan");
    });

    it("skips assistant messages to find the first user message", () => {
      const messages = [
        createMessage("m1", "assistant", "Here is your plan", NOW),
        createMessage("m2", "user", "Plan a trip to Japan", NOW),
      ];

      expect(deriveTitle(messages)).toBe("Plan a trip to Japan");
    });

    it("falls back to New chat for whitespace-only content", () => {
      const messages = [createMessage("m1", "user", "   ", NOW)];

      expect(deriveTitle(messages)).toBe("New chat");
    });

    it("falls back to New chat when there are no messages", () => {
      expect(deriveTitle([])).toBe("New chat");
    });

    it("falls back to New chat when there is no user message", () => {
      const messages = [
        createMessage("m1", "assistant", "Here is your plan", NOW),
      ];

      expect(deriveTitle(messages)).toBe("New chat");
    });

    it("truncates content longer than 50 characters to exactly 50", () => {
      const long = "a".repeat(80);
      const messages = [createMessage("m1", "user", long, NOW)];

      const title = deriveTitle(messages);

      expect(title).toHaveLength(50);
      expect(title).toBe(long.slice(0, 50));
    });

    it("keeps content of exactly 50 characters whole", () => {
      const exact = "b".repeat(50);
      const messages = [createMessage("m1", "user", exact, NOW)];

      expect(deriveTitle(messages)).toBe(exact);
    });
  });

  describe("markInFlight", () => {
    it("sets metadata.inFlight to true on the matching message", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      );

      const result = markInFlight(conversation, "m1", LATER);

      expect(result.messages[0]!.metadata).toEqual({ inFlight: true });
    });

    it("records the marking time on updatedAt (D-27 timestamp)", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      );

      const result = markInFlight(conversation, "m1", LATER);

      expect(result.updatedAt).toBe(LATER);
      expect(conversation.updatedAt).toBe(NOW);
    });

    it("preserves existing metadata fields", () => {
      const conversation = updateMessage(
        addMessage(
          createConversation("c1", NOW),
          createMessage("m1", "user", "Plan a trip", NOW),
        ),
        "m1",
        { metadata: { threadId: "t-1" } },
      );

      const result = markInFlight(conversation, "m1", LATER);

      expect(result.messages[0]!.metadata).toEqual({
        threadId: "t-1",
        inFlight: true,
      });
    });

    it("does not mutate the original conversation", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      );

      const result = markInFlight(conversation, "m1", LATER);

      expect(conversation).not.toBe(result);
      expect(conversation.messages[0]!.metadata).toBeUndefined();
    });
  });

  describe("markError", () => {
    it("attaches the error and clears inFlight", () => {
      const conversation = markInFlight(
        addMessage(
          createConversation("c1", NOW),
          createMessage("m1", "user", "Plan a trip", NOW),
        ),
        "m1",
        LATER,
      );

      const result = markError(
        conversation,
        "m1",
        CUSTOMER_MESSAGES.network,
      );

      expect(result.messages[0]!.metadata).toEqual({
        inFlight: false,
        error: CUSTOMER_MESSAGES.network,
      });
    });

    it("preserves the submitted message content (PERSIST-09)", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip to Japan", NOW),
      );

      const result = markError(
        conversation,
        "m1",
        CUSTOMER_MESSAGES.network,
      );

      expect(result.messages[0]!.content).toBe("Plan a trip to Japan");
      expect(result.messages[0]!.role).toBe("user");
    });

    it("preserves existing metadata fields like threadId", () => {
      const conversation = updateMessage(
        addMessage(
          createConversation("c1", NOW),
          createMessage("m1", "user", "Plan a trip", NOW),
        ),
        "m1",
        { metadata: { threadId: "t-1" } },
      );

      const result = markError(conversation, "m1", CUSTOMER_MESSAGES.http);

      expect(result.messages[0]!.metadata).toEqual({
        threadId: "t-1",
        inFlight: false,
        error: CUSTOMER_MESSAGES.http,
      });
    });

    it("does not mutate the original conversation or its messages", () => {
      const conversation = addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      );

      const result = markError(
        conversation,
        "m1",
        CUSTOMER_MESSAGES.network,
      );

      expect(conversation).not.toBe(result);
      expect(conversation.messages[0]!.metadata).toBeUndefined();
      expect(conversation.messages[0]!.content).toBe("Plan a trip");
    });
  });
});

describe("persistence boundary integration", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists and reads back a single conversation", () => {
    const conversation = addMessage(
      createConversation("c1", NOW),
      createMessage("m1", "user", "Plan a trip to Japan", NOW),
    );

    writeConversations([conversation]);

    expect(readConversations().conversations).toEqual([conversation]);
  });

  it("preserves in-flight state across persist/read round-trip (PERSIST-10)", () => {
    const conversation = markInFlight(
      addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip", NOW),
      ),
      "m1",
      LATER,
    );

    writeConversations([conversation]);

    const result = readConversations();
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0]!.messages[0]!.metadata?.inFlight).toBe(
      true,
    );
  });

  it("preserves error state and the submitted message across persist/read round-trip (PERSIST-09)", () => {
    const conversation = markError(
      addMessage(
        createConversation("c1", NOW),
        createMessage("m1", "user", "Plan a trip to Japan", NOW),
      ),
      "m1",
      CUSTOMER_MESSAGES.network,
    );

    writeConversations([conversation]);

    const result = readConversations();
    expect(result.conversations).toHaveLength(1);
    const message = result.conversations[0]!.messages[0]!;
    expect(message.content).toBe("Plan a trip to Japan");
    expect(message.metadata?.error).toBe(CUSTOMER_MESSAGES.network);
    expect(message.metadata?.inFlight).toBe(false);
  });

  it("preserves multiple conversations in retention order", () => {
    const oldest = addMessage(
      createConversation("c-old", NOW),
      createMessage("m1", "user", "First request", NOW),
    );
    const middle = addMessage(
      createConversation("c-mid", NOW),
      createMessage("m2", "user", "Second request", "2026-01-02T00:00:00Z"),
    );
    const newest = addMessage(
      createConversation("c-new", NOW),
      createMessage("m3", "user", "Third request", "2026-01-03T00:00:00Z"),
    );
    const expected = enforceCap([oldest, middle, newest]).conversations;

    writeConversations([oldest, middle, newest]);

    const result = readConversations();
    expect(result.conversations).toEqual(expected);
    expect(result.conversations.map((conversation) => conversation.id)).toEqual(
      ["c-new", "c-mid", "c-old"],
    );
  });

  it("reads back empty when no cookies exist", () => {
    expect(readConversations()).toEqual({
      conversations: [],
      recovered: false,
      evicted: [],
    });
  });
});
