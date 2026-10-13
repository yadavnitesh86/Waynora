import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mutable isDev holder the mock reads
const { mockIsDev } = vi.hoisted(() => ({
  mockIsDev: { value: true },
}));

vi.mock("./lib/env", () => ({
  get isDev() {
    return mockIsDev.value;
  },
}));

import ErrorBoundary from "./ErrorBoundary";

function Thrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Boom! render crash");
  }
  return <div>OK</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    mockIsDev.value = true;
  });

  it("renders children when no error was caught", () => {
    render(
      <ErrorBoundary>
        <div>App content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("App content")).toBeInTheDocument();
  });

  it("with isDev=true, the pre block renders the error message", () => {
    mockIsDev.value = true;
    const { container } = render(
      <ErrorBoundary>
        <Thrower shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector("pre")).toHaveTextContent("Boom! render crash");
  });

  it("with isDev=false, the pre block is absent and the production panel renders", () => {
    mockIsDev.value = false;
    const { container } = render(
      <ErrorBoundary>
        <Thrower shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(container.querySelector("pre")).toBeNull();
    expect(
      screen.getByText("Something unexpected happened."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Something went wrong on our side. Reload the page to try again.",
      ),
    ).toBeInTheDocument();
  });

  it("with isDev=false, the Reload the page button calls window.location.reload", () => {
    mockIsDev.value = false;
    const reloadSpy = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      value: { ...original, reload: reloadSpy },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <Thrower shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reload the page" }));
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, "location", {
      value: original,
      writable: true,
    });
  });

  it("componentDidCatch console.errors and never renders diagnostics", () => {
    mockIsDev.value = false;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <ErrorBoundary>
        <Thrower shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(consoleSpy).toHaveBeenCalled();
    // The raw error message must not appear in the DOM
    expect(container.textContent).not.toContain("Boom! render crash");
    consoleSpy.mockRestore();
  });
});
