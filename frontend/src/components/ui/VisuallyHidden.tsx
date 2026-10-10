import { forwardRef } from "react";
import type { ReactNode } from "react";

export interface VisuallyHiddenProps {
  children: ReactNode;
  className?: string;
}

/**
 * The standard sr-only clip pattern: present for assistive technology and
 * keyboard users, absent from the visual layout. Used for skip-link-style
 * context that should never shift the composition.
 */
const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ children, className }, ref) {
    return (
      <span
        ref={ref}
        className={
          className === undefined
            ? "sr-only"
            : ["sr-only", className].filter(Boolean).join(" ")
        }
      >
        {children}
      </span>
    );
  },
);

export default VisuallyHidden;
