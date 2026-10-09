import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import { isValidNextPath } from "../../routes/ProtectedRoute";
import {
  AUTH_GENERIC_FAILURE,
  AUTH_SIGNUP_GENERIC_FAILURE,
} from "../../lib/errors";

const { mockSignIn } = vi.hoisted(() => ({ mockSignIn: vi.fn() }));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn, signOut: vi.fn() }),
}));

function renderSignIn(initialEntry = "/signin") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SignInForm />
    </MemoryRouter>,
  );
}

function renderSignUp() {
  return render(
    <MemoryRouter initialEntries={["/signup"]}>
      <SignUpForm />
    </MemoryRouter>,
  );
}

function fillEmail(value: string) {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value },
  });
}

function fillPassword(value: string) {
  fireEvent.change(screen.getByLabelText("Password"), { target: { value } });
}

beforeEach(() => {
  mockSignIn.mockReset();
});

describe("auth forms — validation", () => {
  it("shows inline errors on empty sign-in fields and never calls signIn", async () => {
    renderSignIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Enter your email address."),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("rejects a short sign-up password and a mismatched confirmation", async () => {
    renderSignUp();
    fillEmail("traveler@waynora.test");
    fillPassword("short");
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Use at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("invalid email shape is rejected with the copy-contract message", async () => {
    renderSignIn();
    fillEmail("not-an-email");
    fillPassword("password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});

describe("auth forms — provider failures (TM-04)", () => {
  it("renders the generic sign-in failure and never the raw provider error", async () => {
    mockSignIn.mockRejectedValue(
      new Error("secret provider detail: stack trace"),
    );
    renderSignIn();
    fillEmail("traveler@waynora.test");
    fillPassword("password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(AUTH_GENERIC_FAILURE)).toBeInTheDocument();
    expect(screen.queryByText(/secret provider detail/)).not.toBeInTheDocument();
    expect(mockSignIn).toHaveBeenCalledWith("password", {
      email: "traveler@waynora.test",
      password: "password123",
      flow: "signIn",
    });
  });

  it("renders the generic sign-up failure and never the raw provider error", async () => {
    mockSignIn.mockRejectedValue(new Error("user already exists (raw)"));
    renderSignUp();
    fillEmail("traveler@waynora.test");
    fillPassword("password123");
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(AUTH_SIGNUP_GENERIC_FAILURE),
    ).toBeInTheDocument();
    expect(screen.queryByText(/user already exists/)).not.toBeInTheDocument();
    expect(mockSignIn).toHaveBeenCalledWith("password", {
      email: "traveler@waynora.test",
      password: "password123",
      flow: "signUp",
    });
  });
});

describe("auth forms — submitting state", () => {
  it("disables the submit button and marks the form busy while signing in", async () => {
    let resolveSignIn!: (value: unknown) => void;
    mockSignIn.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    renderSignIn();
    fillEmail("traveler@waynora.test");
    fillPassword("password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
        "aria-busy",
        "true",
      );
    });

    resolveSignIn({ signingIn: true });
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
  });
});

describe("password field toggle (FOUND-05)", () => {
  it("flips the input type between password and text with the aria labels", async () => {
    renderSignIn();
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");

    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input.type).toBe("password");
  });
});

describe("next allowlist (TM-03 open-redirect protection)", () => {
  it("accepts single-leading-slash paths and rejects external targets", () => {
    expect(isValidNextPath("/chat")).toBe(true);
    expect(isValidNextPath("/chat?tab=1")).toBe(true);
    // Both plan-verification cases: fall back to /chat instead of redirecting.
    expect(isValidNextPath("//evil.com")).toBe(false);
    expect(isValidNextPath("https://evil.com")).toBe(false);
    expect(isValidNextPath("javascript:alert(1)")).toBe(false);
  });
});
