import { forwardRef } from "react";
import type { MouseEvent } from "react";

export interface SkipLinkProps {
  /** Anchor target; the layout's `<main id="main">`. */
  href?: string;
  /** Fixed by the copywriting contract — do not reword. */
  children?: string;
}

/**
 * "Skip to content" — the first focusable element in the layout (D-14).
 *
 * Visually hidden until `:focus-visible`, then a raised chip pinned to the
 * top-left corner. Activation moves focus to `#main` programmatically so the
 * link works even where the browser's native fragment-focus is unreliable.
 */
const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(function SkipLink(
  { href = "#main", children = "Skip to content" },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector<HTMLElement>("#main");
    if (target === null) {
      return;
    }
    // We move focus ourselves; suppress the default fragment navigation.
    event.preventDefault();
    target.focus();
  };

  return (
    <a
      ref={ref}
      href={href}
      onClick={handleClick}
      className={[
        "sr-only",
        "focus:not-sr-only focus:fixed focus:top-2xs focus:left-2xs focus:z-50",
        "focus:inline-flex focus:items-center focus:min-h-[44px]",
        "focus:rounded-md focus:border focus:border-line",
        "focus:bg-surface-raised focus:px-md focus:py-sm",
        "focus:shadow-md focus:text-small focus:font-semibold focus:text-ink",
      ].join(" ")}
    >
      {children}
    </a>
  );
});

export default SkipLink;
