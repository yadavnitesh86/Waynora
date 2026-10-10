import { forwardRef, useEffect, useState } from "react";
import type { Ref } from "react";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  /** 16 / 20 / 24px — the UI-SPEC inline-SVG sizes. */
  size?: SpinnerSize;
  className?: string;
}

// Inline SVG only (UI-SPEC icon contract); stroke inherits currentColor.
const PIXELS: Record<SpinnerSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Reads `prefers-reduced-motion` so the spinner can degrade to the static
 * three-dot form required by the reduced-motion contract.
 *
 * Falls back to "no preference" when matchMedia is unavailable (jsdom without
 * a mock, or any non-DOM environment) — the static form is only for users who
 * explicitly asked for reduced motion.
 */
function usePrefersReducedMotion(): boolean {
  const query =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : undefined;

  const [reduced, setReduced] = useState(query?.matches === true);

  useEffect(() => {
    if (query === undefined) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [query]);

  return reduced;
}

function Dot() {
  return (
    <span
      className="inline-block h-[6px] w-[6px] rounded-full bg-accent"
      aria-hidden="true"
    />
  );
}

/**
 * Loading indicator: `role="status"` + `aria-label="Loading"`, which makes it
 * an implicit polite live region.
 *
 * Under `prefers-reduced-motion: reduce` it renders three static dots instead
 * of a rotating arc, so nothing on screen moves continuously.
 */
const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "md", className },
  ref: Ref<HTMLSpanElement>,
) {
  const reduced = usePrefersReducedMotion();
  const pixels = PIXELS[size];

  if (reduced) {
    return (
      <span
        ref={ref}
        role="status"
        aria-label="Loading"
        className={className ?? "inline-flex items-center gap-2xs"}
      >
        <span aria-hidden="true" className="inline-flex items-center gap-2xs">
          <Dot />
          <Dot />
          <Dot />
        </span>
      </span>
    );
  }

  return (
    <span
      ref={ref}
      role="status"
      aria-label="Loading"
      className={className ?? "inline-flex items-center"}
    >
      <svg
        width={pixels}
        height={pixels}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="animate-spin text-accent"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="42 14"
          opacity="0.9"
        />
      </svg>
    </span>
  );
});

export default Spinner;
