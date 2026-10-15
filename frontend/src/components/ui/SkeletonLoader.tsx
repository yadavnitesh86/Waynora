import type { HTMLAttributes } from "react";

export interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  className?: string;
  "aria-label"?: string;
}

/**
 * Accessible shimmer loading placeholder (QUAL-06, D-05).
 *
 * Uses `role="status"` and `aria-label="Loading"` (customizable) to communicate
 * in-progress state to assistive technologies, while presenting a subtle, organic
 * shimmer animation using design token `--color-line`.
 */
export default function SkeletonLoader({
  variant = "text",
  width,
  height,
  className = "",
  "aria-label": ariaLabel = "Loading",
  style,
  ...rest
}: SkeletonLoaderProps) {
  const variantStyles = {
    text: "h-4 w-full rounded-sm",
    rectangular: "w-full h-full rounded-md",
    circular: "rounded-full shrink-0",
  }[variant];

  const customDimensions = {
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`relative overflow-hidden bg-line/60 ${variantStyles} ${className}`}
      style={customDimensions}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-raised/40 to-transparent animate-shimmer motion-reduce:hidden"
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
