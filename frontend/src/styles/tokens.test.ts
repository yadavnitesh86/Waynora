import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Design tokens (05-UI-SPEC)", () => {
  const tokensPath = path.resolve(__dirname, "tokens.css");
  const tokensContent = fs.readFileSync(tokensPath, "utf-8");

  it("defines the curated Nocturne Navy & Champagne Gold palette tokens", () => {
    expect(tokensContent).toContain("--color-canvas: #FAF8F5;");
    expect(tokensContent).toContain("--color-surface: #FCFAF7;");
    expect(tokensContent).toContain("--color-surface-raised: #FFFFFF;");
    expect(tokensContent).toContain("--color-ink: #111827;");
    expect(tokensContent).toContain("--color-ink-muted: #4B5563;");
    expect(tokensContent).toContain("--color-line: #E5E0D8;");
    expect(tokensContent).toContain("--color-accent: #162A45;");
    expect(tokensContent).toContain("--color-accent-ink: #FFFFFF;");
    expect(tokensContent).toContain("--color-accent-soft: #EEF3F8;");
    expect(tokensContent).toContain("--color-focus: #C8A97E;");
  });

  it("defines the dark section tokens for high-contrast dark panels", () => {
    expect(tokensContent).toContain("--color-surface-dark: #0B1017;");
    expect(tokensContent).toContain("--color-surface-dark-raised: #141C26;");
    expect(tokensContent).toContain("--color-ink-inverse: #F9FAFB;");
    expect(tokensContent).toContain("--color-ink-inverse-muted: #94A3B8;");
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
