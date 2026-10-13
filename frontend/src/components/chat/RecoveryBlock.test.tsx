import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecoveryBlock from "./RecoveryBlock";
import {
  RECOVERY_ACTION_LABEL,
  RECOVERY_COPY,
  type RecoveryKind,
} from "../../lib/chat/failure";

/**
 * All seven kinds, including the seventh (`reload-recovery`) which is derived
 * at render time and never persisted in `metadata.error`.
 */
const KINDS: RecoveryKind[] = [
  "network",
  "timeout",
  "http",
  "malformed",
  "unexpected",
  "aborted",
  "reload-recovery",
];

describe("RecoveryBlock", () => {
  it.each(KINDS)(
    "renders the %s kind with its verbatim headline and body",
    (kind) => {
      const { unmount } = render(
        <RecoveryBlock kind={kind} onRetry={vi.fn()} />,
      );

      // Headline is the role=alert ErrorText.
      expect(screen.getByRole("alert")).toHaveTextContent(
        RECOVERY_COPY[kind].headline,
      );
      // Body is verbatim, em-dashes included.
      expect(screen.getByText(RECOVERY_COPY[kind].body)).toBeInTheDocument();

      unmount();
    },
  );

  it("renders the Try again action labelled with the recovery action constant", () => {
    render(<RecoveryBlock kind="network" onRetry={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: RECOVERY_ACTION_LABEL }),
    ).toBeInTheDocument();
  });

  it("fires onRetry exactly once per deliberate click", () => {
    const onRetry = vi.fn();
    render(<RecoveryBlock kind="http" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: RECOVERY_ACTION_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("hides the warning glyph from assistive technology so colour is never the sole signal", () => {
    const { container } = render(
      <RecoveryBlock kind="malformed" onRetry={vi.fn()} />,
    );

    const glyph = container.querySelector("svg");
    expect(glyph).not.toBeNull();
    expect(glyph).toHaveAttribute("aria-hidden", "true");
  });

  it("never renders raw diagnostics, status codes, or provider messages", () => {
    render(<RecoveryBlock kind="http" onRetry={vi.fn()} />);

    // QUAL-01 / T-03-11: nothing but the contracted customer-safe strings.
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/500|502|503|fetch failed|ECONN|stack/i);
  });
});
