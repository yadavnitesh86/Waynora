import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SkeletonLoader from "./SkeletonLoader";

describe("SkeletonLoader", () => {
  it("renders with role status and accessible name", () => {
    render(<SkeletonLoader />);
    const el = screen.getByRole("status");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-label", "Loading");
  });

  it("supports custom aria-label", () => {
    render(<SkeletonLoader aria-label="Loading conversation history" />);
    expect(
      screen.getByRole("status", { name: "Loading conversation history" }),
    ).toBeInTheDocument();
  });

  it("renders with circular variant styles", () => {
    render(<SkeletonLoader variant="circular" width={40} height={40} />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("rounded-full");
    expect(el).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("renders with rectangular variant styles", () => {
    render(<SkeletonLoader variant="rectangular" className="h-32" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("rounded-md");
  });
});
