import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RootLayout from "./RootLayout";

vi.mock("../auth/useCurrentUser", () => ({
  useAuthState: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
  })),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({
    signOut: vi.fn(),
  }),
}));

describe("RootLayout (Shell & Attribution)", () => {
  it("renders the custom brand logo and wordmark in the header", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<div>Child Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const logoImages = screen.getAllByRole("img", { name: "Waynora Logo" });
    expect(logoImages.length).toBeGreaterThanOrEqual(1);
    expect(logoImages[0]).toHaveAttribute("src", "/logo.png");
    expect(screen.getAllByText("Waynora").length).toBeGreaterThanOrEqual(1);
  });

  it("renders verified author attribution with rel, target, and aria-label in the footer (LAND-05)", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<div>Child Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const attributionLink = screen.getByRole("link", {
      name: "YADAV NITESH's GitHub profile",
    });

    expect(attributionLink).toBeInTheDocument();
    expect(attributionLink).toHaveAttribute("href", "https://github.com/yadavnitesh86");
    expect(attributionLink).toHaveAttribute("target", "_blank");
    expect(attributionLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(attributionLink).toHaveTextContent("YADAV NITESH");
    expect(screen.getByText("AI-powered travel planning")).toBeInTheDocument();
  });
});
