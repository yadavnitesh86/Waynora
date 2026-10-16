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
  it("lays out a centered container that splits sidebar and chat from md up", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Japan itinerary please");

    // Centered page container at every width.
    expect(container.querySelector('[class*="max-w-container-xl"]')).toBeTruthy();

    // The md+ split: [auto sidebar | 1fr chat], main column ordered second
    // in DOM so the route h1 leads the heading outline.
    const split = container.querySelector('[class*="md:grid-cols"]');
    expect(split?.className).toContain("md:grid");
    expect(split?.className).toContain("md:grid-cols-[auto_1fr]");
    expect(split?.className).toContain("md:items-start");
    expect(split?.className).toContain("md:gap-xl");
    const mainColumn = container.querySelector('[class*="md:order-2"]');
    expect(mainColumn).not.toBeNull();
  });

  it("keeps the composer sticky to the bottom of the chat column", async () => {
    render(<Chat />);
    await screen.findByText("Japan itinerary please");

    const sticky = document.querySelector(".sticky.bottom-0");
    expect(sticky).not.toBeNull();
    expect(sticky?.className).toContain("bottom-0");
    // Opaque canvas background so thread content never shows through.
    expect(sticky?.className).toContain("bg-canvas");
    expect(
      sticky?.contains(screen.getByLabelText("Your trip request")),
    ).toBe(true);
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
    // The persistent md+ panel stays put, as a pinned (non-overlay) column.
    expect(sidebarNav()).toHaveClass("visible", "translate-x-0");
    expect(sidebarNav()).toHaveClass("md:sticky", "md:shrink-0");
  });
});

describe("Chat waiting lounge responsiveness (QUAL-04, GAME-01)", () => {
  it("puts the game side-by-side from lg and stacked below it", async () => {
    const { container } = render(<Chat />);
    await screen.findByText("Japan itinerary please");

    typeAndSubmit("10 days in Japan in April");
    const board = await screen.findByRole("grid", {
      name: "2048 game board",
    });

    // The lounge card lives inside the shell's two-column grid.
    const lounge = screen.getByRole("heading", {
      level: 4,
      name: "Waiting lounge",
    });
    const grid = lounge.closest("div")?.parentElement;
    expect(grid?.className).toContain("grid");
    expect(grid?.className).toContain("gap-lg");
    expect(grid?.className).toContain("xl:grid-cols-[1fr_320px]");
    expect(grid?.className).toContain("xl:items-start");

    // The board itself is fluid: it fills its column on small viewports and
    // caps at max-w-md on wide ones — no fixed pixel width anywhere.
    expect(board.className).not.toMatch(/w-\[\d/);
    expect(container.querySelector('[class*="max-w-md"]')).toBeTruthy();

    // Timing copy and stop control remain visible next to the game.
    expect(
      screen.getByText("Plans usually take 5 to 15 minutes."),
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
