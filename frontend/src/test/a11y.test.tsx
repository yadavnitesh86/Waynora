import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation } from "../lib/cookie/schema";
import type { AskResult } from "../lib/errors";
import RootLayout from "../layouts/RootLayout";
import Landing from "../routes/Landing";
import SignIn from "../routes/SignIn";
import SignUp from "../routes/SignUp";
import Chat from "../routes/Chat";
import NotFound from "../routes/NotFound";
import { router } from "../routes";
import { Spinner } from "../components/ui";
import Game2048 from "../components/game/Game2048";
import { initGame } from "../lib/game/2048/engine";
import { expectNoAxeViolations } from "./axe";

const { mockAuthState, mockSignOut, mockAsk, mockReadConversations, mockWriteConversations } =
  vi.hoisted(() => ({
    mockAuthState: {
      isAuthenticated: false,
      isLoading: false,
      userId: null as string | null,
    },
    mockSignOut: vi.fn(),
    mockAsk: vi.fn(),
    mockReadConversations: vi.fn(),
    mockWriteConversations: vi.fn(),
  }));

vi.mock("../auth/useCurrentUser", () => ({
  useAuthState: () => mockAuthState,
  useCurrentUser: () => null,
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: mockSignOut }),
}));

// The network boundary is faked so the waiting room (and its 2048 board)
// can be reached without a backend; the repository is faked so these
// accessibility runs are hermetic regardless of leftover cookies.
vi.mock("../lib/api/ask", () => ({ askBackend: mockAsk }));
vi.mock("../lib/cookie/repository", () => ({
  readConversations: mockReadConversations,
  writeConversations: mockWriteConversations,
}));

interface RouteCase {
  path: string;
  name: string;
  title: string;
  authenticated?: boolean;
}

const ROUTE_CASES: RouteCase[] = [
  {
    path: "/",
    name: "landing",
    title: "Waynora",
  },
  {
    path: "/signin",
    name: "sign in",
    title: "Sign in · Waynora",
  },
  {
    path: "/signup",
    name: "sign up",
    title: "Create account · Waynora",
  },
  {
    path: "/chat",
    name: "chat (authenticated)",
    // C-01/C-02: the document title is the conversation title, which is
    // "New chat" before the first user message (D-26).
    title: "New chat · Waynora",
    authenticated: true,
  },
  {
    path: "/there-is-no-such-page",
    name: "404",
    title: "Page not found · Waynora",
  },
];

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** Elements reachable by sequential Tab presses, in DOM order. */
function tabbableElements(): HTMLElement[] {
  const selector = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => element.getAttribute("tabindex") !== "-1",
  );
}

/** Conversations handed to the chat route by the repository fake. */
let snapshot: Conversation[] = [];

function stubSnapshot(conversations: Conversation[]) {
  snapshot = conversations;
}

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

beforeEach(() => {
  mockSignOut.mockReset();
  snapshot = [];
  // The ask promise stays pending so the waiting room remains mounted
  // while axe runs over it.
  mockAsk.mockImplementation(() => new Promise<AskResult>(() => {}));
  mockReadConversations.mockImplementation(() => ({
    conversations: snapshot,
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
  // axe-core's html-has-lang rule needs a document language to be present.
  document.documentElement.setAttribute("lang", "en");
});

describe("route table", () => {
  it("declares every Phase 1 route", () => {
    const children = router.routes[0]?.children ?? [];
    const paths = children.map((route) => route.path);
    expect(paths).toEqual(["/", "/signin", "/signup", "/chat", "*"]);
  });
});

describe("axe-core on every route", () => {
  for (const routeCase of ROUTE_CASES) {
    it(`has no critical or serious violations on ${routeCase.name}`, async () => {
      mockAuthState.isAuthenticated = routeCase.authenticated ?? false;
      const { container } = renderRoute(routeCase.path);

      const all = await expectNoAxeViolations(container);
      // Minor/moderate/best-practice findings are surfaced, never silently
      // swallowed: print them so a regression shows up in the test output.
      if (all.length > 0) {
        console.info(
          `[axe] non-blocking findings on ${routeCase.name}:`,
          all.map((finding) => `${finding.id} (${finding.impact})`).join(", "),
        );
      }
      expect(container).toBeTruthy();
    });
  }
});

describe("skip link", () => {
  it("is the first focusable element in the shell", () => {
    const { unmount } = renderRoute("/");
    const tabbable = tabbableElements();
    expect(tabbable.length).toBeGreaterThan(1);
    expect(tabbable[0]?.textContent).toBe("Skip to content");
    unmount();
  });

  it("moves focus to #main when activated", () => {
    const { unmount } = renderRoute("/");
    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    const main = document.getElementById("main");
    expect(main).not.toBeNull();
    expect(main).toHaveAttribute("tabindex", "-1");

    fireEvent.click(skipLink);

    expect(main).toHaveFocus();
    unmount();
  });
});

describe("keyboard traversal", () => {
  it("reaches every primary nav link exactly once on the landing page", () => {
    const { unmount } = renderRoute("/");

    const nav = screen.getByRole("navigation", { name: "Primary" });
    const navLinks = Array.from(nav.querySelectorAll<HTMLElement>("a[href]"));
    // The wordmark lives outside the nav as a brand link, so the nav itself
    // carries exactly the two session links.
    expect(navLinks.map((link) => link.textContent)).toEqual([
      "Sign in",
      "Create account",
    ]);

    const tabbable = tabbableElements();
    for (const navLink of navLinks) {
      expect(tabbable.filter((element) => element === navLink)).toHaveLength(1);
    }
    unmount();
  });

  it("walks the landing page in the expected tab order", () => {
    const { unmount } = renderRoute("/");
    const labels = tabbableElements().map((element) => element.textContent);
    expect(labels).toEqual([
      "Skip to content",
      "Waynora",
      "Sign in",
      "Create account",
      "Create your free account",
      "Sign in",
    ]);
    unmount();
  });

  it("uses no positive tabindex anywhere in the shell", () => {
    const { unmount } = renderRoute("/");
    const positive = Array.from(
      document.querySelectorAll("[tabindex]"),
    ).filter((element) => {
      const value = Number(element.getAttribute("tabindex"));
      return Number.isFinite(value) && value > 0;
    });
    expect(positive).toHaveLength(0);
    unmount();
  });
});

describe("document metadata", () => {
  it("sets a distinct title on every route", () => {
    for (const routeCase of ROUTE_CASES) {
      mockAuthState.isAuthenticated = routeCase.authenticated ?? false;
      const { unmount } = renderRoute(routeCase.path);
      expect(document.title).toBe(routeCase.title);
      unmount();
    }
  });

  it("writes and restores the meta description", () => {
    const { unmount } = renderRoute("/");
    const meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute("content")).toBe(
      "AI trip planning — tell us where you want to go",
    );
    unmount();
    expect(document.title).not.toBe("Waynora");
  });
});

describe("reduced motion", () => {
  it("renders static dots instead of a rotation for Spinner", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      })),
    );

    render(<Spinner />);
    const status = screen.getByRole("status", { name: "Loading" });
    expect(status.querySelector("svg")).toBeNull();
    expect(status.querySelectorAll("span[aria-hidden='true'] span")).toHaveLength(3);

    vi.unstubAllGlobals();
  });
});

describe("axe-core on chat history and waiting surfaces", () => {
  it("has no critical or serious violations with the history drawer open over its scrim", async () => {
    mockAuthState.isAuthenticated = true;
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

    const { container } = renderRoute("/chat");
    await screen.findByText("Japan itinerary please");

    // The open drawer overlays the thread with its decorative scrim —
    // both the panel contents and the overlay state get audited.
    fireEvent.click(screen.getByRole("button", { name: "Open chat history" }));
    expect(
      screen.getByRole("navigation", { name: "Chat history" }),
    ).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it("has no critical or serious violations in the active waiting room with the 2048 board", async () => {
    mockAuthState.isAuthenticated = true;

    const { container } = renderRoute("/chat");
    await screen.findByText("Where do you want to go?");

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "10 days in Japan" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });

    expect(
      await screen.findByRole("grid", { name: "2048 game board" }),
    ).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it("has no critical or serious violations on the 2048 win overlay", async () => {
    const base = initGame(() => 0.5);
    const { container } = render(
      <Game2048 initialState={{ ...base, won: true }} />,
    );
    expect(screen.getByText("You win!")).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it("has no critical or serious violations on the 2048 game-over overlay", async () => {
    const base = initGame(() => 0.5);
    const { container } = render(
      <Game2048 initialState={{ ...base, gameOver: true }} />,
    );
    expect(screen.getByText("Game Over")).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });
});
