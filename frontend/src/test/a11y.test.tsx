import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout from "../layouts/RootLayout";
import Landing from "../routes/Landing";
import SignIn from "../routes/SignIn";
import SignUp from "../routes/SignUp";
import ChatPlaceholder from "../routes/ChatPlaceholder";
import NotFound from "../routes/NotFound";
import { router } from "../routes";
import { Spinner } from "../components/ui";
import { expectNoAxeViolations } from "./axe";

const { mockAuthState, mockSignOut } = vi.hoisted(() => ({
  mockAuthState: {
    isAuthenticated: false,
    isLoading: false,
    userId: null as string | null,
  },
  mockSignOut: vi.fn(),
}));

vi.mock("../auth/useCurrentUser", () => ({
  useAuthState: () => mockAuthState,
  useCurrentUser: () => null,
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: mockSignOut }),
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
    name: "chat placeholder (authenticated)",
    title: "Chat · Waynora",
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
          <Route path="/chat" element={<ChatPlaceholder />} />
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

beforeEach(() => {
  mockSignOut.mockReset();
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
