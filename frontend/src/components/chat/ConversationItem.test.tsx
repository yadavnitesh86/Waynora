import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation } from "../../lib/cookie/schema";
import ConversationItem, { formatTimestamp } from "./ConversationItem";

/** Fixed clock: 2026-01-05 midday UTC. */
const NOW = new Date("2026-01-05T12:00:00Z");

function makeConversation(
  overrides: Partial<Conversation> = {},
): Conversation {
  return {
    id: "conv-1",
    title: "Japan trip",
    createdAt: "2026-01-05T09:30:00Z",
    updatedAt: "2026-01-05T09:30:00Z",
    messages: [],
    ...overrides,
  };
}

function renderItem(
  overrides: Partial<Parameters<typeof ConversationItem>[0]> = {},
) {
  const props = {
    conversation: makeConversation(),
    isActive: false,
    isRenaming: false,
    isConfirmingDelete: false,
    onSelect: vi.fn(),
    onStartRename: vi.fn(),
    onRename: vi.fn(),
    onCancelRename: vi.fn(),
    onStartDelete: vi.fn(),
    onDelete: vi.fn(),
    onCancelDelete: vi.fn(),
    ...overrides,
  };
  const view = render(<ConversationItem {...props} />);
  return { ...props, unmount: view.unmount };
}

/**
 * The row's select button: the title span's closest button, so the lookup
 * cannot collide with the "Rename …"/"Delete …" action buttons.
 */
function selectButton(): HTMLElement {
  const title = screen.getByText("Japan trip");
  return title.closest("button") as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ConversationItem (browsing)", () => {
  it("renders the title and today's timestamp as a clock time (UTC)", () => {
    renderItem();
    expect(screen.getByText("Japan trip")).toBeInTheDocument();
    expect(screen.getByText("9:30 AM")).toBeInTheDocument();
  });

  it("renders an older conversation's timestamp as a calendar date", () => {
    renderItem({
      conversation: makeConversation({
        updatedAt: "2026-01-01T09:30:00Z",
      }),
    });
    expect(screen.getByText("Jan 1, 2026")).toBeInTheDocument();
  });

  it("marks the active conversation with aria-current and leaves others unmarked", () => {
    const { unmount } = renderItem({ isActive: true });
    expect(selectButton()).toHaveAttribute("aria-current", "true");
    unmount();

    renderItem({ isActive: false });
    expect(selectButton()).not.toHaveAttribute("aria-current");
  });

  it("selects the conversation when the row is clicked", () => {
    const props = renderItem();

    fireEvent.click(selectButton());

    expect(props.onSelect).toHaveBeenCalledWith("conv-1");
  });

  it("offers a labelled rename action that enters rename mode", () => {
    const props = renderItem();

    fireEvent.click(
      screen.getByRole("button", { name: "Rename Japan trip" }),
    );

    expect(props.onStartRename).toHaveBeenCalledWith("conv-1");
  });

  it("offers a labelled delete action that enters confirmation", () => {
    const props = renderItem();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Japan trip" }),
    );

    expect(props.onStartDelete).toHaveBeenCalledWith("conv-1");
  });
});

describe("ConversationItem (rename)", () => {
  it("shows the current title in a focused, selected field", () => {
    renderItem({ isRenaming: true });

    const field = screen.getByLabelText("Chat title");
    expect(field).toHaveValue("Japan trip");
    expect(field).toHaveFocus();
  });

  it("saves the trimmed title on submit", () => {
    const props = renderItem({ isRenaming: true });

    fireEvent.change(screen.getByLabelText("Chat title"), {
      target: { value: "  Japan with the kids  " },
    });
    fireEvent.submit(screen.getByLabelText("Chat title").closest("form")!);

    expect(props.onRename).toHaveBeenCalledWith("conv-1", "Japan with the kids");
  });

  it("caps the title at 50 characters", () => {
    renderItem({ isRenaming: true });
    expect(screen.getByLabelText("Chat title")).toHaveAttribute(
      "maxlength",
      "50",
    );
  });

  it("rejects a blank title with a validation error and stays in edit mode", () => {
    const props = renderItem({ isRenaming: true });

    fireEvent.change(screen.getByLabelText("Chat title"), {
      target: { value: "   " },
    });
    fireEvent.submit(screen.getByLabelText("Chat title").closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a title for this chat.",
    );
    expect(screen.getByLabelText("Chat title")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(props.onRename).not.toHaveBeenCalled();
  });

  it("clears the validation error as soon as the user types again", () => {
    renderItem({ isRenaming: true });

    fireEvent.change(screen.getByLabelText("Chat title"), {
      target: { value: " " },
    });
    fireEvent.submit(screen.getByLabelText("Chat title").closest("form")!);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Chat title"), {
      target: { value: "J" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("cancels on Escape without saving", () => {
    const props = renderItem({ isRenaming: true });

    fireEvent.keyDown(screen.getByLabelText("Chat title"), {
      key: "Escape",
      code: "Escape",
    });

    expect(props.onCancelRename).toHaveBeenCalledTimes(1);
    expect(props.onRename).not.toHaveBeenCalled();
  });
});

describe("ConversationItem (delete confirmation)", () => {
  it("asks for confirmation and deletes on the destructive action", () => {
    const props = renderItem({ isConfirmingDelete: true });

    expect(
      screen.getByText("Delete this chat? This can't be undone."),
    ).toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm).toHaveFocus();

    fireEvent.click(confirm);
    expect(props.onDelete).toHaveBeenCalledWith("conv-1");
  });

  it("keeps the chat on the cancel action", () => {
    const props = renderItem({ isConfirmingDelete: true });

    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    expect(props.onCancelDelete).toHaveBeenCalledTimes(1);
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it("cancels on Escape", () => {
    const props = renderItem({ isConfirmingDelete: true });

    fireEvent.keyDown(
      screen.getByRole("group", { name: "Delete Japan trip" }),
      { key: "Escape", code: "Escape" },
    );

    expect(props.onCancelDelete).toHaveBeenCalledTimes(1);
    expect(props.onDelete).not.toHaveBeenCalled();
  });
});

describe("formatTimestamp", () => {
  it("formats a same-day timestamp as a UTC clock time", () => {
    expect(formatTimestamp("2026-01-05T09:30:00Z", NOW)).toBe("9:30 AM");
  });

  it("formats an older timestamp as a UTC calendar date", () => {
    expect(formatTimestamp("2026-01-01T23:45:00Z", NOW)).toBe("Jan 1, 2026");
  });

  it("returns an empty string for an unparseable timestamp", () => {
    expect(formatTimestamp("not-a-date", NOW)).toBe("");
  });
});
