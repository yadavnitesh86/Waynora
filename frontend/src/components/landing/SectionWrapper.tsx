import type { ReactNode } from "react";

export interface SectionWrapperProps {
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: ReactNode;
  dark?: boolean;
}

/**
 * Section container with consistent editorial rhythm, semantic landmarks,
 * and responsive horizontal padding (D-02, D-06).
 */
export default function SectionWrapper({
  id,
  ariaLabelledBy,
  className = "",
  children,
  dark = false,
}: SectionWrapperProps) {
  const bgClass = dark ? "bg-surface-dark text-ink-inverse" : "bg-canvas text-ink";

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`w-full py-2xl md:py-3xl transition-colors ${bgClass} ${className}`}
    >
      <div className="mx-auto w-full max-w-container-xl px-md">
        {children}
      </div>
    </section>
  );
}
