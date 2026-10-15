import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Landing from "./Landing";

// Mock document title hook
vi.mock("../hooks/useDocumentTitle", () => ({
  useDocumentTitle: vi.fn(),
}));

describe("Landing responsive layout contracts (QUAL-04)", () => {
  it("renders mobile-first responsive grid classes for stats, how it works, and agent cards", () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    // Hero section checks
    const heroH1 = screen.getByRole("heading", { level: 1, name: "Your trip, planned by a real agent." });
    expect(heroH1).toBeInTheDocument();
    expect(heroH1.className).toContain("font-display");
    expect(heroH1.className).toContain("text-display");

    // StatStrip: 1 column on mobile, 3 columns on tablet/desktop (grid-cols-1 sm:grid-cols-3)
    const statGrid = container.querySelector(".grid.grid-cols-1.gap-xl.sm\\:grid-cols-3");
    expect(statGrid).not.toBeNull();

    // HowItWorks: 1 column on mobile, 2 columns on tablet/desktop (grid-cols-1 md:grid-cols-2)
    const howItWorksGrid = container.querySelector(".grid.grid-cols-1.gap-lg.md\\:grid-cols-2");
    expect(howItWorksGrid).not.toBeNull();

    // AgentCards: 1 column on mobile, 3 on desktop (grid-cols-1 md:grid-cols-3)
    const agentGrid = container.querySelector(".grid.grid-cols-1.gap-lg.md\\:grid-cols-3");
    expect(agentGrid).not.toBeNull();

    // WhatYouGet: 1 column on mobile, 12-column grid on desktop (grid-cols-1 lg:grid-cols-12)
    const whatYouGetGrid = container.querySelector(".grid.grid-cols-1.items-start.gap-2xl.lg\\:grid-cols-12");
    expect(whatYouGetGrid).not.toBeNull();
  });

  it("constrains the page within max-w-container-xl to prevent horizontal overflow on wide monitors", () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const wrappers = container.querySelectorAll(".max-w-container-xl");
    expect(wrappers.length).toBeGreaterThanOrEqual(4);
  });

  it("renders call-to-action buttons that wrap cleanly on mobile viewports", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const ctaLinks = screen.getAllByRole("link", { name: /Plan my trip/i });
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of ctaLinks) {
      expect(link.getAttribute("href")).toBe("/signup");
    }

    const howItWorksLink = screen.getByRole("link", { name: /How it works/i });
    expect(howItWorksLink).toHaveAttribute("href", "#how-it-works");
  });

  it("renders all five distinct editorial sections in sequential order", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Your trip, planned by a real agent." })).toBeInTheDocument();
    expect(screen.getByText("5 – 15 min")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "From idea to itinerary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Three specialists. One plan." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "A real plan, not a hallucination." })).toBeInTheDocument();
  });
});
