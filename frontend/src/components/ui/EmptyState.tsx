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
 * Luxury editorial empty surface: bespoke double-bezel framing,
 * gold compass emblem, heading, muted body, and inspiration pills.
 */
const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, body, action, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "rounded-[2rem] border border-gold/30 bg-surface/80 p-2 shadow-luxury backdrop-blur-xs max-w-2xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="rounded-[calc(2rem-0.5rem)] border border-line/80 bg-surface-raised p-xl md:p-2xl">
        <div className="flex items-center gap-3 mb-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/40 bg-accent-soft text-accent shadow-2xs">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold font-bold">
              ATELIER CONCIERGE
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-mono text-ink-muted">
                3 SPECIALISTS STANDING BY
              </span>
            </div>
          </div>
        </div>

        <h3 className="font-display text-h2 font-semibold text-ink text-balance tracking-tight">
          {title}
        </h3>
        <p className="mt-sm text-lead leading-[1.65] text-ink-muted">{body}</p>

        {/* Inspirational luxury travel ideas */}
        <div className="mt-xl border-t border-line/60 pt-md">
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted/80 mb-2 font-semibold">
            Ideas for your brief:
          </p>
          <div className="flex flex-wrap gap-2 text-caption">
            <span className="rounded-full border border-line/80 bg-canvas/70 px-3 py-1 text-ink-muted transition-colors hover:border-gold hover:text-ink">
              ✦ 10 days in Japan in April, cherry blossom season
            </span>
            <span className="rounded-full border border-line/80 bg-canvas/70 px-3 py-1 text-ink-muted transition-colors hover:border-gold hover:text-ink">
              ✦ 2 weeks across Northern Italy & Amalfi coast
            </span>
            <span className="rounded-full border border-line/80 bg-canvas/70 px-3 py-1 text-ink-muted transition-colors hover:border-gold hover:text-ink">
              ✦ Swiss Alps scenic rail & boutique alpine havens
            </span>
          </div>
        </div>

        {action === undefined ? null : <div className="mt-lg">{action}</div>}
      </div>
    </div>
  );
});

export default EmptyState;
