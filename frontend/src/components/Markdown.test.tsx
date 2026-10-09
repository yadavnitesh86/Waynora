import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("strips raw HTML including img onerror", () => {
    const { container } = render(
      <Markdown content={'<img src="x" onerror="alert(1)">Hello'} />,
    );
    // No actual <img> element should be rendered — raw HTML is escaped, not executed
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("neutralizes javascript: links", () => {
    const { container } = render(
      <Markdown content={'[click me](javascript:alert(1))'} />,
    );
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("");
  });

  it("renders GFM tables", () => {
    const { container } = render(
      <Markdown content={"| A | B |\n|---|---|\n| 1 | 2 |"} />,
    );
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("keeps https:// links with rel=noopener noreferrer", () => {
    const { container } = render(
      <Markdown content={"[site](https://example.com)"} />,
    );
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link?.getAttribute("target")).toBe("_blank");
  });
});
