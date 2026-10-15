import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AssistantMessage from "./AssistantMessage";
import type { Message } from "../../lib/cookie/schema";

function makeAssistantMessage(content: string): Message {
  return {
    id: "msg-adv-1",
    role: "assistant",
    content,
    createdAt: "2026-10-15T10:00:00Z",
  };
}

describe("AssistantMessage adversarial hardening (QUAL-03)", () => {
  it("sanitizes hostile HTML script and iframe tags", () => {
    const hostile = "Normal plan text <script>alert('xss')</script> and <iframe src='https://malicious.example.com'></iframe>";
    const { container } = render(
      <AssistantMessage message={makeAssistantMessage(hostile)} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText(/Normal plan text/i)).toBeInTheDocument();
  });

  it("strips or disarms hostile img onerror and svg onload handlers", () => {
    const hostile = `<img src="nonexistent.jpg" onerror="alert(1)" /> and <svg onload="window.hack=1"><circle r="5" /></svg>`;
    const { container } = render(
      <AssistantMessage message={makeAssistantMessage(hostile)} />,
    );

    // img is allowed element if markdown syntax, but raw HTML tags without matching allowedElements are sanitized
    const img = container.querySelector("img");
    if (img) {
      expect(img.getAttribute("onerror")).toBeNull();
    }
    const svg = container.querySelector("svg");
    expect(svg).toBeNull();
  });

  it("neutralizes malicious javascript: URI schemes in Markdown links", () => {
    const hostile = "[Click here](javascript:alert(document.cookie))";
    const { container } = render(
      <AssistantMessage message={makeAssistantMessage(hostile)} />,
    );

    const anchor = container.querySelector("a");
    if (anchor) {
      expect(anchor.getAttribute("href")).not.toContain("javascript:");
    }
  });

  it("neutralizes data: and vbscript: URI schemes in Markdown links", () => {
    const hostile = "[Data Link](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==) and [VB Link](vbscript:msgbox(1))";
    const { container } = render(
      <AssistantMessage message={makeAssistantMessage(hostile)} />,
    );

    const anchors = container.querySelectorAll("a");
    for (const a of anchors) {
      const href = a.getAttribute("href") ?? "";
      expect(href.toLowerCase()).not.toContain("data:");
      expect(href.toLowerCase()).not.toContain("vbscript:");
    }
  });

  it("ensures safe external https links receive target=_blank and rel=noopener noreferrer", () => {
    const safeLink = "Check the [Official Travel Guide](https://example.com/guide) for details.";
    const { container } = render(
      <AssistantMessage message={makeAssistantMessage(safeLink)} />,
    );

    const anchor = container.querySelector("a");
    expect(anchor).toBeInTheDocument();
    expect(anchor?.getAttribute("href")).toBe("https://example.com/guide");
    expect(anchor?.getAttribute("target")).toBe("_blank");
    expect(anchor?.getAttribute("rel")).toContain("noopener");
    expect(anchor?.getAttribute("rel")).toContain("noreferrer");
  });

  it("renders deeply nested structures, unclosed code blocks, and large payloads without throwing", () => {
    const unclosedCode = "Here is a code block:\n```python\ndef plan():\n    print('incomplete')\n";
    const nestedTables = `
| Day | Activity | Location |
| --- | --- | --- |
| 1 | Tour | Centro |
| 2 | Museum | Gallery |
`;
    const largePayload = "Repeat plan paragraph. ".repeat(150);

    expect(() => {
      render(
        <AssistantMessage message={makeAssistantMessage(unclosedCode + "\n" + nestedTables + "\n" + largePayload)} />,
      );
    }).not.toThrow();

    expect(screen.getByText(/Here is a code block/i)).toBeInTheDocument();
    expect(screen.getByText(/Activity/i)).toBeInTheDocument();
  });
});
