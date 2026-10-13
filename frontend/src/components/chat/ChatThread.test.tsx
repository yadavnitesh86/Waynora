import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChatThread from "./ChatThread";
import { createMessage } from "../../lib/chat/domain";
import type { Message } from "../../lib/cookie/schema";

const NOW = "2026-01-01T00:00:00Z";

function user(
  id: string,
  content: string,
  metadata?: Message["metadata"],
): Message {
  return { ...createMessage(id, "user", content, NOW), metadata };
}

function assistant(id: string, content: string): Message {
  return createMessage(id, "assistant", content, NOW);
}

function renderThread(
  messages: Message[],
  activeMessageId: string | null = null,
  onRetry: (message: Message) => void = vi.fn(),
) {
  return render(
    <ChatThread
      messages={messages}
      activeMessageId={activeMessageId}
      onRetry={onRetry}
    />,
  );
}

describe("ChatThread", () => {
  it("renders an ol labelled Conversation with one li per turn in DOM order", () => {
    renderThread([user("m1", "First turn"), assistant("m2", "Second turn")]);

    const list = screen.getByRole("list", { name: "Conversation" });
    expect(list.tagName).toBe("OL");

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    // Oldest first: the user turn precedes the assistant turn.
    expect(items[0]).toHaveTextContent("First turn");
    expect(items[1]).toHaveTextContent("Second turn");
  });

  it("carries no live region on the list (double-announcement rule)", () => {
    const { container } = renderThread([user("m1", "one turn")]);

    const list = container.querySelector("ol");
    expect(list).not.toBeNull();
    expect(list).not.toHaveAttribute("aria-live");
    expect(list).not.toHaveAttribute("aria-atomic");
    // An implicit role is fine; an explicit one would override semantics.
    expect(list).not.toHaveAttribute("role");
  });

  it("captions the turns You and Waynora", () => {
    renderThread([user("m1", "mine"), assistant("m2", "theirs")]);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Waynora")).toBeInTheDocument();
  });

  it("makes the user turn the only raised card and leaves the assistant turn flat", () => {
    const { container } = renderThread([
      user("m1", "mine"),
      assistant("m2", "theirs"),
    ]);

    // Exactly one raised card on the surface, and it holds the user's words.
    const raised = container.querySelectorAll(".bg-surface-raised");
    expect(raised).toHaveLength(1);
    expect(raised[0]?.textContent).toContain("mine");

    // The assistant turn carries no card — it is flat prose on the canvas.
    const items = screen.getAllByRole("listitem");
    expect(items[1]?.querySelector(".bg-surface-raised")).toBeNull();
  });

  it("shows the C-15 footer with a spinner only for the active in-flight message", () => {
    renderThread([user("m1", "still going", { inFlight: true })], "m1");

    expect(screen.getByText("Waiting for your plan")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    // A live request is not a failure, so no alert block appears.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the reload-recovery block for a persisted in-flight message with no active request", () => {
    renderThread([user("m1", "left running", { inFlight: true })], null);

    // PERSIST-09/PERSIST-10: the prompt survives, and the block explains that
    // nothing was restarted.
    expect(screen.getByText("left running")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This request was still running when you left.",
    );
    // No in-flight footer while recovering.
    expect(screen.queryByText("Waiting for your plan")).not.toBeInTheDocument();
  });

  it("prefers the stored failure kind over reload-recovery", () => {
    renderThread(
      [user("m1", "failed", { inFlight: false, error: "network" })],
      null,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't reach the server.",
    );
  });

  it("falls back to the unexpected block for an unknown persisted error key", () => {
    renderThread(
      [user("m1", "corrupt", { inFlight: false, error: "not-a-real-kind" })],
      null,
    );

    // A corrupt cookie artifact is not a crash: the conservative block still
    // gives the user an honest, safe message and a way out.
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something unexpected happened.",
    );
  });

  it("renders the assistant answer through the safe Markdown component", () => {
    renderThread([assistant("m2", "## Your itinerary\n\nDay one in Kyoto.")]);

    // Rendered as real markdown structure, not as raw text.
    expect(
      screen.getByRole("heading", { level: 2, name: "Your itinerary" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Day one in Kyoto.")).toBeInTheDocument();
  });
});
