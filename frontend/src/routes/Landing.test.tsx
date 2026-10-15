import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Landing from "./Landing";

describe("Landing Route (LAND-01..LAND-06)", () => {
  it("renders the primary H1 and value proposition", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Your trip, planned by a real agent.",
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders primary and secondary CTAs with correct destinations", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const primaryCta = screen.getByRole("link", {
      name: /Plan my trip/i,
    });
    expect(primaryCta).toBeInTheDocument();
    expect(primaryCta).toHaveAttribute("href", "/signup");

    const secondaryCta = screen.getByRole("link", {
      name: /How it works/i,
    });
    expect(secondaryCta).toBeInTheDocument();
    expect(secondaryCta).toHaveAttribute("href", "#how-it-works");
  });

  it("renders honest timing expectations without fake progress", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByText("5 – 15 min")).toBeInTheDocument();
    expect(screen.getByText("Average planning time")).toBeInTheDocument();
    expect(
      screen.getByText("No fake progress or hallucinated plans"),
    ).toBeInTheDocument();
  });

  it("accurately names the three specialist agents (LAND-03)", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Destination Planner" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Transport Agent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "AccommodationWeather Agent" }),
    ).toBeInTheDocument();
  });

  it("displays the example plan structure explicitly labeled as not real (LAND-04)", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Example structure — not a real Waynora output"),
    ).toBeInTheDocument();
  });
});
