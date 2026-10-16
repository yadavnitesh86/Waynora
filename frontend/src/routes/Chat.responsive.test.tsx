import { readFileSync } from "node:fs";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation } from "../lib/cookie/schema";
import type { AskResult } from "../lib/errors";

// `?raw` CSS imports are mocked away by vitest's default css handling, so the
// reduced-motion contract is asserted against the real stylesheet on disk
// (vitest runs with the project root as cwd).
const globalsCss = readFileSync("src/styles/globals.css", "utf8");

const { mockAsk, mockReadConversations, mockWriteConversations } = vi.hoisted(
  () => ({
    mockAsk: vi.fn(),
    mockReadConversations: vi.fn(),
    mockWriteConversations: vi.fn(),
  }),
);

vi.mock("../lib/api/ask", () => ({ askBackend: mockAsk }));
vi.mock("../lib/cookie/repository", () => ({
  readConversations: mockReadConversations,
  writeConversations: mockWriteConversations,
}));

import Chat from "./Chat";

/**
 * QUAL-04 responsive contracts for the chat route.
 *
 * jsdom cannot compute real viewport breakpoints, so these tests pin the
 * CLASS CONTRACTS the layout relies on (drawer below `md`, persistent
 * collapsible panel at `md`, two-column split with wide stream from `lg`)
 * plus the matchMedia-driven behaviour that adapts to the viewport. The
 * real browser pass across 375px / tablet / desktop remains the human
 * gate recorded in 04-01's coverage metadata.
 */

const store = { conversations: [] as Conversation[] };

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

/**
 * Viewport stub for `isDesktopViewport()` in ChatSidebar: only the
 * min-width 768px query can match, and only when simulating desktop.
 */
function stubViewport(desktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: desktop && query.includes("min-width: 768px"),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })),
  );
}

function sidebarNav(): HTMLElement {
  return screen.getByRole("navigation", { name: "Chat history" });
}

function hamburger(): HTMLElement {
  return screen.getByRole("button", { name: "Open chat history" });
}

function typeAndSubmit(text: string) {
  const textarea = screen.getByLabelText("Your trip request");
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAsk.mockImplementation(() => new Promise<AskResult>(() => {}));
  mockReadConversations.mockImplementation(() => ({
    conversations: store.conversations,
    recovered: false,
    evicted: [],
  }));
  mockWriteConversations.mockImplementation(
    (conversations: Conversation[]) => ({
      conversations,
      recovered: false,
      evicted: [],
    }),
  );
  store.conversations = [
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
  ];
  document.documentElement.setAttribute("lang", "en");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Chat responsive layout contracts (QUAL-04)", () => {
  it("lays out a full-width, no-scroll shell with a centered message column", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Japan itinerary please");

    // No centered container anywhere: the shell is full width, so nothing
    // floats away from the screen edges.
    expect(
      container.querySelector('[class*="max-w-container-xl"]'),
    ).toBeNull();

    // The shell is a full-width flex row that fills the available height.
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toContain("flex");
    expect(shell.className).toContain("h-full");
    expect(shell.className).toContain("w-full");

    // The sidebar is the first column, fixed 260px, touching the far left.
    const sidebar = within(container).getByRole("navigation", {
      name: "Chat history",
    });
    expect(sidebar.className).toContain("md:w-[260px]");
    expect(sidebar.className).toContain("md:shrink-0");

    // The message column is centered inside the chat area — the only thing
    // that is centered, never the whole app. Scoped to the element that is
    // BOTH the scroll region and the centering flex, so it cannot match the
    // sidebar's own scrollable list.
    const scroll = container.querySelector(
      '[class*="overflow-y-auto"][class*="justify-center"]',
    );
    expect(scroll?.className).toContain("flex-1");
    expect(
      scroll?.querySelector('[class*="max-w-[760px]"]'),
    ).toBeTruthy();
  });

  it("pins the composer at the bottom of the chat area without a sticky dock", async () => {
    render(<Chat />);
    await screen.findByText("Japan itinerary please");

    // The old sticky dock is gone; the composer is a plain flex child.
    expect(document.querySelector(".sticky.bottom-0")).toBeNull();

    // The message list is the only scrolling region. Scoped to the element
    // that is both the scroll region and the chat-area centering flex, so it
    // cannot match the sidebar's own scrollable list.
    const scroll = document.querySelector(
      '[class*="overflow-y-auto"][class*="justify-center"]',
    );
    expect(scroll?.className).toContain("flex-1");

    // The composer sits outside the scroll region, pinned below it.
    expect(
      scroll?.contains(screen.getByLabelText("Your trip request")),
    ).toBe(false);
  });

  it("shows the drawer trigger on mobile only and the collapse toggle on desktop only", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Japan itinerary please");

    expect(hamburger()).toHaveClass("md:hidden");
    const collapseToggle = within(sidebarNav()).getByRole("button", {
      name: "Hide chat history",
    });
    expect(collapseToggle).toHaveClass("hidden", "md:inline-flex");
    // The in-drawer close button is the mobile counterpart.
    const closeButton = within(sidebarNav()).getByRole("button", {
      name: "Close chat history",
    });
    expect(closeButton).toHaveClass("md:hidden");

    // Decorative mobile scrim appears with the open drawer and sits behind
    // it (z-20 < z-30).
    expect(container.querySelector('[class*="bg-ink/40"]')).toBeNull();
    fireEvent.click(hamburger());
    const scrim = container.querySelector('[class*="bg-ink/40"]');
    expect(scrim).toHaveClass("fixed", "inset-0", "z-20", "md:hidden");
  });

  it("opens the drawer over the thread and returns focus to the trigger on Escape", async () => {
    render(<Chat />);
    await screen.findByText("Japan itinerary please");

    fireEvent.click(hamburger());
    expect(hamburger()).toHaveAttribute("aria-expanded", "true");
    expect(sidebarNav()).toHaveClass("visible", "translate-x-0");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(hamburger()).toHaveAttribute("aria-expanded", "false");
    expect(sidebarNav()).toHaveClass("invisible", "-translate-x-full");
    expect(hamburger()).toHaveFocus();
  });

  it("closes the drawer after navigating on a mobile viewport", async () => {
    stubViewport(false);
    render(<Chat />);
    await screen.findByText("Japan itinerary please");

    fireEvent.click(hamburger());
    fireEvent.click(
      within(sidebarNav()).getByText("Paris plan").closest("button")!,
    );

    expect(
      await screen.findByText("Paris itinerary please"),
    ).toBeInTheDocument();
    expect(sidebarNav()).toHaveClass("invisible", "-translate-x-full");
  });

  it("keeps the panel open after navigating on a desktop viewport", async () => {
    stubViewport(true);
    render(<Chat />);
    await screen.findByText("Japan itinerary please");

    fireEvent.click(hamburger());
    fireEvent.click(
      within(sidebarNav()).getByText("Paris plan").closest("button")!,
    );

    expect(
      await screen.findByText("Paris itinerary please"),
    ).toBeInTheDocument();
    // The persistent md+ panel stays put, as a stretched (non-overlay) column.
    expect(sidebarNav()).toHaveClass("visible", "translate-x-0");
    expect(sidebarNav()).toHaveClass("md:static", "md:shrink-0");
  });
});

describe("Chat waiting lounge responsiveness (QUAL-04, GAME-01)", () => {
  it("places the game in a left rail beside the chat, never in the chat column", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Japan itinerary please");

    typeAndSubmit("10 days in Japan in April");
    const board = await screen.findByRole("grid", {
      name: "2048 game board",
    });

    // The lounge is a direct child of the full-width shell: a fixed-width
    // rail between the sidebar and the chat, never a column stealing chat
    // width from inside the chat area.
    const lounge = screen.getByRole("heading", {
      level: 4,
      name: "Waiting lounge",
    });
    const loungeCard = lounge.closest("div") as HTMLElement;
    expect(loungeCard.className).toContain("md:w-80");
    expect(loungeCard.className).toContain("md:shrink-0");
    const shell = loungeCard.parentElement as HTMLElement;
    expect(shell.className).toContain("flex");
    expect(shell.className).toContain("w-full");

    // The board itself is fluid: it fills its column on small viewports and
    // caps at max-w-md on wide ones — no fixed pixel width anywhere.
    expect(board.className).not.toMatch(/w-\[\d/);
    expect(container.querySelector('[class*="max-w-md"]')).toBeTruthy();

    // Waiting copy and stop control live in the request's own bubble.
    expect(
      screen.getByText("Plans usually take 15 to 20 minutes."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Stop waiting" }),
    ).toBeInTheDocument();
  });
});

describe("reduced motion (QUAL-04, D-14)", () => {
  it("ships the global override that collapses every animation and transition", () => {
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalsCss).toContain("animation-duration: 0.01ms !important");
    expect(globalsCss).toContain("transition-duration: 0.01ms !important");
    expect(globalsCss).toContain("scroll-behavior: auto !important");
  });

  it("animates the drawer and game tiles with transform/opacity only, motion-reduce guarded", async () => {
    render(<Chat />);
    await screen.findByText("Japan itinerary please");

    // Drawer: transform-only at the locked 200ms ease-out, with an explicit
    // motion-reduce guard on top of the global override.
    fireEvent.click(hamburger());
    expect(sidebarNav().className).toContain("transition-transform");
    expect(sidebarNav().className).toContain("duration-200");
    expect(sidebarNav().className).toContain("ease-out");
    expect(sidebarNav().className).toContain("motion-reduce:transition-none");
    expect(sidebarNav().className).not.toContain("transition-all");

    // Game tiles: opacity/transform pop with the motion-reduce guard.
    typeAndSubmit("10 days in Japan in April");
    const board = await screen.findByRole("grid", {
      name: "2048 game board",
    });
    const tile = board.querySelector('[class*="animate-tile-"]');
    expect(tile).not.toBeNull();
    expect(tile?.className).toContain("motion-reduce:animate-none");
  });
});
