import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";
import TextField from "./TextField";
import ErrorText from "./ErrorText";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import VisuallyHidden from "./VisuallyHidden";
import SkipLink from "./SkipLink";
import PageHeader from "./PageHeader";
import TextArea from "./TextArea";
import * as barrel from "./index";

const PRIMITIVE_EXPORTS = [
  "Button",
  "TextField",
  "ErrorText",
  "Spinner",
  "EmptyState",
  "VisuallyHidden",
  "SkipLink",
  "PageHeader",
  "TextArea",
] as const;

describe("ui barrel", () => {
  it("exports all nine primitives from one module", () => {
    for (const name of PRIMITIVE_EXPORTS) {
      expect(barrel[name], name).toBeDefined();
    }
    expect(Object.keys(barrel)).toHaveLength(PRIMITIVE_EXPORTS.length);
  });
});

describe("Button", () => {
  it("forwards aria-busy while submitting and stays focusable", () => {
    render(
      <Button type="submit" isSubmitting>
        Sign in
      </Button>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    // The visible label must remain the accessible name while submitting —
    // the Spinner's own label must not leak into the button's name.
    expect(screen.getByRole("button", { name: "Sign in" })).toBe(button);
    // The loading live region is a child of the button.
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("does not mark a resting button busy", () => {
    render(<Button variant="secondary">Sign in</Button>);
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("border-line");
  });

  it("renders an anchor when href is given", () => {
    render(
      <Button href="/signup" variant="secondary">
        Create your free account
      </Button>,
    );
    const link = screen.getByRole("link", {
      name: "Create your free account",
    });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("merges its classes into an asChild element without losing its own", () => {
    render(
      <MemoryRouter>
        <Button asChild variant="secondary">
          <a href="/signin" className="own-class">
            Sign in
          </a>
        </Button>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toHaveClass("bg-transparent");
    expect(link).toHaveClass("own-class");
  });

  it("keeps the consumer's click handler when asChild is used", () => {
    const onClick = vi.fn();
    render(
      <Button asChild href="#main">
        <a href="#other" onClick={onClick}>
          Skip to content
        </a>
      </Button>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Skip to content" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("TextField", () => {
  it("links the label, hint, and error through aria-describedby", () => {
    render(
      <TextField
        label="Email address"
        hint="We never share it."
        error="Enter a valid email address."
        defaultValue=""
      />,
    );

    const input = screen.getByLabelText("Email address");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    const ids = (describedBy ?? "").split(" ");
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(input).toHaveAttribute("aria-invalid", "true");

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid email address.");
    expect(ids).toContain(alert.id);
  });

  it("omits aria-describedby when there is no hint or error", () => {
    render(<TextField label="Password" defaultValue="" />);
    const input = screen.getByLabelText("Password");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });
});

describe("ErrorText", () => {
  it("renders a role=alert paragraph in the danger colour step", () => {
    render(<ErrorText>We couldn't sign you in.</ErrorText>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("We couldn't sign you in.");
    expect(alert).toHaveClass("text-danger");
    expect(alert.tagName).toBe("P");
  });
});

describe("Spinner", () => {
  it("exposes role=status with the Loading label", () => {
    render(<Spinner />);
    const status = screen.getByRole("status", { name: "Loading" });
    expect(status.querySelector("svg")).not.toBeNull();
  });

  it("renders three static dots under prefers-reduced-motion", () => {
    const listeners: Array<() => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: (_: string, handler: () => void) =>
          listeners.push(handler),
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

describe("EmptyState", () => {
  it("renders an h3 title, muted body, and an optional action", () => {
    render(
      <EmptyState
        title="Your trip goes here"
        body="Nothing to show yet."
        action={<button type="button">Sign out</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Your trip goes here" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nothing to show yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});

describe("VisuallyHidden", () => {
  it("keeps content in the accessibility tree with the sr-only clip", () => {
    render(<VisuallyHidden>Extra context</VisuallyHidden>);
    const node = screen.getByText("Extra context");
    expect(node).toHaveClass("sr-only");
  });
});

describe("SkipLink", () => {
  it("uses the exact copy-contract string", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toBeInTheDocument();
  });

  it("moves focus to #main on activation", () => {
    render(
      <>
        <SkipLink />
        <main id="main" tabIndex={-1}>
          content
        </main>
      </>,
    );
    const main = document.getElementById("main");
    fireEvent.click(screen.getByRole("link", { name: "Skip to content" }));
    expect(main).toHaveFocus();
  });
});

describe("PageHeader", () => {
  it("renders the route h1 with eyebrow and lede", () => {
    render(
      <PageHeader
        eyebrow="AI trip planning"
        title="Plan a trip worth the wait."
        lede="Tell us where you want to go."
        actions={<button type="button">Create your free account</button>}
      />,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Plan a trip worth the wait.");
    expect(screen.getByText("AI trip planning")).toHaveClass("text-accent");
    expect(screen.getByText("Tell us where you want to go.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create your free account" }),
    ).toBeInTheDocument();
  });
});
