import { forwardRef } from "react";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Small overline above the title. The only accent text outside links and
   *  the primary button (UI-SPEC accent reservations). */
  eyebrow?: string;
  /** Renders the route `<h1>` using the fluid `text-h1` token. */
  title: string;
  /** Supporting paragraph, capped at the 58ch lead measure. */
  lede?: string;
  /** Optional action node (usually `Button` elements). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Page-level heading block. Owns the route `<h1>` so every surface shares one
 * heading treatment: serif display, fluid scale, balanced wrapping.
 */
const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  { eyebrow, title, lede, actions, className },
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
      {eyebrow === undefined ? null : (
        <p className="text-overline font-semibold uppercase tracking-[0.12em] text-accent">
          {eyebrow}
        </p>
      )}
      <h1
        className={`font-display text-h1 font-semibold text-ink text-balance${
          eyebrow === undefined ? "" : " mt-sm"
        }${lede === undefined && actions === undefined ? "" : " mb-md"}`}
      >
        {title}
      </h1>
      {lede === undefined ? null : (
        <p className="text-lead leading-[1.55] text-ink-muted max-w-[58ch]">
          {lede}
        </p>
      )}
      {actions === undefined ? null : (
        <div className="mt-lg flex flex-wrap items-center gap-md">{actions}</div>
      )}
    </div>
  );
});

export default PageHeader;
