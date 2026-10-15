import { forwardRef, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ErrorText from "./ErrorText";

export interface TextFieldProps
  extends Omit<ComponentPropsWithoutRef<"input">, "children"> {
  /** Always visible. Placeholder-only labels are banned (a11y contract 6). */
  label: string;
  /** Helper copy rendered under the field and wired into `aria-describedby`. */
  hint?: ReactNode;
  /** Error copy. Presence also sets `aria-invalid` and a `role="alert"` node. */
  error?: string;
  /**
   * Optional adornment rendered inside the input row (e.g. the password
   * show/hide toggle). An additive slot, in the same spirit as the
   * `actions`/`action` node slots on PageHeader and EmptyState.
   */
  trailing?: ReactNode;
}

const INPUT_BASE = [
  "w-full min-h-[44px] px-md py-sm text-ink text-body",
  "rounded-md border bg-surface-raised transition-all duration-150 ease-out",
  "placeholder:text-ink-muted/60",
  "focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink",
].join(" ");

/**
 * Labelled text input with the full a11y wiring the UI-SPEC contract requires:
 *
 * - a visible `<label>` bound to the input (`useId`-derived id)
 * - `aria-invalid` when `error` is set
 * - `aria-describedby` listing the hint id and the error id
 * - a `role="alert"` error line with a leading decorative icon, so colour is
 *   never the only error signal
 */
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    trailing,
    className,
    id,
    required,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy =
    [
      hint === undefined ? null : hintId,
      error === undefined ? null : errorId,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2xs block text-small font-medium text-ink"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy}
          required={required}
          className={[
            INPUT_BASE,
            trailing === undefined ? null : "pr-3xl",
            error === undefined ? "border-line" : "border-danger",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {trailing === undefined ? null : (
          <div className="absolute inset-y-0 right-0 flex items-center pr-sm">
            {trailing}
          </div>
        )}
      </div>
      {hint === undefined ? null : (
        <div id={hintId} className="mt-2xs text-caption text-ink-muted">
          {hint}
        </div>
      )}
      {error === undefined ? null : (
        <div className="mt-2xs flex items-start gap-2xs">
          {/* Non-colour error signal — never read by screen readers. */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="mt-3xs shrink-0 text-danger"
          >
            <circle
              cx="8"
              cy="8"
              r="6.75"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 4.75v3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="11.25" r="0.75" fill="currentColor" />
          </svg>
          <ErrorText id={errorId}>{error}</ErrorText>
        </div>
      )}
    </div>
  );
});

export default TextField;
