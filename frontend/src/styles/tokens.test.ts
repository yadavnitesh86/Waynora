import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Design tokens (05-UI-SPEC)", () => {
  const tokensPath = path.resolve(__dirname, "tokens.css");
  const tokensContent = fs.readFileSync(tokensPath, "utf-8");

  it("defines the curated Verdigris & Linen palette tokens", () => {
    expect(tokensContent).toContain("--color-canvas: #FAF7F2;");
    expect(tokensContent).toContain("--color-surface: #FFFDF9;");
    expect(tokensContent).toContain("--color-surface-raised: #FFFFFF;");
    expect(tokensContent).toContain("--color-ink: #1C1917;");
    expect(tokensContent).toContain("--color-ink-muted: #57534E;");
    expect(tokensContent).toContain("--color-line: #E7E2DA;");
    expect(tokensContent).toContain("--color-accent: #1B4D3E;");
    expect(tokensContent).toContain("--color-accent-ink: #FFFFFF;");
    expect(tokensContent).toContain("--color-accent-soft: #EBF2EE;");
    expect(tokensContent).toContain("--color-focus: #C2410C;");
  });

  it("defines the dark section tokens for high-contrast dark panels", () => {
    expect(tokensContent).toContain("--color-surface-dark: #121816;");
    expect(tokensContent).toContain("--color-surface-dark-raised: #1A2320;");
    expect(tokensContent).toContain("--color-ink-inverse: #F7F4EE;");
    expect(tokensContent).toContain("--color-ink-inverse-muted: #9BA49E;");
  });

  it("maps Fraunces as the display serif typography", () => {
    expect(tokensContent).toContain('--font-display: "Fraunces"');
  });

  it("defines motion tokens for transitions and reveals", () => {
    expect(tokensContent).toContain("--duration-fast: 120ms;");
    expect(tokensContent).toContain("--duration-base: 200ms;");
    expect(tokensContent).toContain("--duration-slow: 400ms;");
    expect(tokensContent).toContain("--duration-reveal: 600ms;");
    expect(tokensContent).toContain("--ease-out: cubic-bezier(0.16, 1, 0.3, 1);");
  });
});
