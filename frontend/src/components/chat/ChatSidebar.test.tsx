import { render, screen, fireEvent, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation } from "../../lib/cookie/schema";
import ChatSidebar from "./ChatSidebar";
import { expectNoAxeViolations } from "../../test/axe";

/** Fixed clock so the list timestamps are deterministic. */
const NOW = new Date("2026-01-05T12:00:00Z");

function makeConversation(
  id: string,
  overrides: Partial<Conversation> = {},
): Conversation {
  return {
    id,
    title: `Chat ${id}`,
    createdAt: "2026-01-05T09:00:00Z",
    updatedAt: "2026-01-05T09:00:00Z",
    messages: [],
    ...overrides,
  };
}

function renderSidebar(
  overrides: Partial<Parameters<typeof ChatSidebar>[0]> = {},
) {
  const props = {
    conversations: [makeConversation("conv-1"), makeConversation("conv-2")],
    activeId: "conv-1",
    isOpen: true,
    onClose: vi.fn(),
    onCreateConversation: vi.fn(),
    onSelectConversation: vi.fn(),
    onRenameConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
    ...overrides,
  };
  const view = render(<ChatSidebar {...props} />);
  return { ...props, unmount: view.unmount, container: view.container };
}

function savedChats() {
  return within(screen.getByRole("list", { name: "Saved chats" }));
}

/**
 * A conversation row's select button, looked up through its title so it
 * cannot collide with that row's "Rename …"/"Delete …" action buttons.
 */
function rowSelectButton(title: string): HTMLElement {
  return screen.getByText(title).closest("button") as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ChatSidebar (structure)", () => {
  it("renders the chat history landmark with the new chat action", () => {
    renderSidebar();

    expect(
      screen.getByRole("navigation", { name: "Chat history" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New chat" }),
    ).toBeInTheDocument();
  });

  it("focuses the landmark when it opens", () => {
    renderSidebar({ isOpen: true });

    expect(screen.getByRole("navigation", { name: "Chat history" })).toHaveFocus();
  });

  it("creates a new chat from the primary action", () => {
    const props = renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));

    expect(props.onCreateConversation).toHaveBeenCalledTimes(1);
    // jsdom reports a mobile viewport, so the drawer closes after the
    // navigation — the desktop panel deliberately stays open.
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("lists every conversation newest first and marks the active one", () => {
    renderSidebar({
      conversations: [
        makeConversation("conv-new", { updatedAt: "2026-01-05T10:00:00Z" }),
        makeConversation("conv-old", { updatedAt: "2026-01-01T10:00:00Z" }),
      ],
      activeId: "conv-old",
    });

    const items = savedChats().getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Chat conv-new");
    expect(rowSelectButton("Chat conv-old")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(rowSelectButton("Chat conv-new")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows the empty state when there are no conversations", () => {
    renderSidebar({ conversations: [], activeId: null });

    expect(screen.getByText("No chats yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start a new chat and your trip conversations will appear here.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Saved chats" }),
    ).not.toBeInTheDocument();
  });

  it("renders the drawer as hidden while closed and visible while open", () => {
    const { unmount } = renderSidebar({ isOpen: false });
    const nav = screen.getByRole("navigation", { name: "Chat history" });
    expect(nav.className).toContain("-translate-x-full");
    unmount();

    renderSidebar({ isOpen: true });
    expect(
      screen.getByRole("navigation", { name: "Chat history" }).className,
    ).toContain("translate-x-0");
  });
});

describe("ChatSidebar (navigation)", () => {
  it("selects a conversation and closes the drawer on a mobile viewport", () => {
    const props = renderSidebar();

    fireEvent.click(rowSelectButton("Chat conv-2"));

    expect(props.onSelectConversation).toHaveBeenCalledWith("conv-2");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("renames a conversation through the inline editor", () => {
    const props = renderSidebar();

    fireEvent.click(
      savedChats().getByRole("button", { name: "Rename Chat conv-2" }),
    );
    const field = screen.getByLabelText("Chat title");
    expect(field).toHaveValue("Chat conv-2");

    fireEvent.change(field, { target: { value: "Japan with the kids" } });
    fireEvent.submit(field.closest("form")!);

    expect(props.onRenameConversation).toHaveBeenCalledWith(
      "conv-2",
      "Japan with the kids",
    );
    // The editor closes after a successful save.
    expect(screen.queryByLabelText("Chat title")).not.toBeInTheDocument();
  });

  it("confirms before deleting a conversation", () => {
    const props = renderSidebar();

    fireEvent.click(
      savedChats().getByRole("button", { name: "Delete Chat conv-2" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(props.onDeleteConversation).toHaveBeenCalledWith("conv-2");
    // The confirmation closes after the deletion.
    expect(
      screen.queryByText("Delete this chat? This can't be undone."),
    ).not.toBeInTheDocument();
  });

  it("keeps a conversation when the delete confirmation is dismissed", () => {
    const props = renderSidebar();

    fireEvent.click(
      savedChats().getByRole("button", { name: "Delete Chat conv-2" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    expect(props.onDeleteConversation).not.toHaveBeenCalled();
    expect(savedChats().getAllByRole("listitem")).toHaveLength(2);
  });

  it("cancels a stranded rename when another conversation is selected", () => {
    const props = renderSidebar();

    fireEvent.click(
      savedChats().getByRole("button", { name: "Rename Chat conv-2" }),
    );
    expect(screen.getByLabelText("Chat title")).toBeInTheDocument();

    fireEvent.click(rowSelectButton("Chat conv-1"));

    expect(screen.queryByLabelText("Chat title")).not.toBeInTheDocument();
    expect(props.onSelectConversation).toHaveBeenCalledWith("conv-1");
    expect(props.onRenameConversation).not.toHaveBeenCalled();
  });

  it("closes on Escape, but never while an inline edit owns the keyboard", () => {
    const props = renderSidebar();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(
      savedChats().getByRole("button", { name: "Rename Chat conv-1" }),
    );
    // Escape reaches the field, so it cancels the rename — the sidebar's
    // own Escape listener is deliberately disengaged during the edit, so
    // the close count does not move.
    fireEvent.keyDown(screen.getByLabelText("Chat title"), {
      key: "Escape",
      code: "Escape",
    });
    expect(screen.queryByLabelText("Chat title")).not.toBeInTheDocument();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from its own close control", () => {
    const props = renderSidebar();

    fireEvent.click(
      screen.getByRole("button", { name: "Close chat history" }),
    );

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("exposes the desktop collapse toggle with aria-expanded", () => {
    renderSidebar({ isOpen: true });

    expect(
      screen.getByRole("button", { name: "Hide chat history" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});

describe("ChatSidebar (accessibility)", () => {
  // axe-core schedules internal async work; fake timers stall it, so the
  // a11y cases opt back into real timers before the run.
  it("has no critical or serious axe violations in the open drawer", async () => {
    vi.useRealTimers();
    const { container } = renderSidebar();
    document.documentElement.setAttribute("lang", "en");

    await expectNoAxeViolations(container);
  });

  it("has no critical or serious axe violations mid-rename and mid-delete-confirmation", async () => {
    vi.useRealTimers();
    const { container } = renderSidebar();
    document.documentElement.setAttribute("lang", "en");

    fireEvent.click(
      savedChats().getByRole("button", { name: "Rename Chat conv-2" }),
    );
    await expectNoAxeViolations(container);

    fireEvent.keyDown(screen.getByLabelText("Chat title"), {
      key: "Escape",
      code: "Escape",
    });
    fireEvent.click(
      savedChats().getByRole("button", { name: "Delete Chat conv-2" }),
    );
    await expectNoAxeViolations(container);
  });
});
