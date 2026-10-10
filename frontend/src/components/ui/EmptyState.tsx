import { forwardRef } from "react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** H3 — the surface's strongest heading, never the page `<h1>`. */
  title: string;
  /** Supporting copy in muted ink. */
  body: string;
  /** Optional action node (usually a `Button`). */
  action?: ReactNode;
  className?: string;
}

/**
 * Neutral empty surface: heading, muted body, optional action.
 *
 * Used by the Phase 1 chat placeholder so later phases can drop their real
 * empty states in without inventing a new shape.
 */
const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, body, action, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={
        className === undefined
          ? "max-w-prose"
          : ["max-w-prose", className].filter(Boolean).join(" ")
      }
    >
      <h3 className="font-sans text-h3 font-semibold text-ink text-balance">
        {title}
      </h3>
      <p className="mt-sm text-lead leading-[1.55] text-ink-muted">{body}</p>
      {action === undefined ? null : <div className="mt-lg">{action}</div>}
    </div>
  );
});

export default EmptyState;
