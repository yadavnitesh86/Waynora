import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from "./App";

/**
 * Regression for the second blank-page bug: main.tsx wrapped <App/> in
 * <BrowserRouter> while App renders <RouterProvider router={router}>. A data
 * router already provides its own <Router>, so nesting two made react-router
 * throw "You cannot render a <Router> inside another <Router>" at mount.
 *
 * Every other suite mocks the auth hooks and uses MemoryRouter, so the real
 * composition in main.tsx had never been rendered. This test renders that
 * composition - AuthProvider over App - exactly as main.tsx does.
 */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("main.tsx composition (regression: nested routers)", () => {
  it("renders AuthProvider over App without a nested <Router>", async () => {
    const client = new ConvexReactClient("https://example.convex.cloud");
    render(
      <ConvexAuthProvider client={client} storage={memoryStorage()}>
        <App />
      </ConvexAuthProvider>,
    );
    // The default 1s findBy timeout is a wall-clock budget: under full-suite
    // parallelism this real composition (auth client + router + landing)
    // routinely needs longer, which made the regression test flaky whenever
    // another jsdom-heavy suite was added (observed with the 04-02 game
    // suites). 10s keeps the regression semantics and removes the flake.
    expect(
      await screen.findByText(
        /Plan a trip worth the wait/i,
        {},
        { timeout: 10_000 },
      ),
    ).toBeTruthy();
  });
});
