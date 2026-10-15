import { forwardRef, useId, useRef, useEffect } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ErrorText from "./ErrorText";

export interface TextAreaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "children"> {
  label: string;
  hint?: ReactNode;
  error?: string;
  compact?: boolean;
  labelClassName?: string;
}

const TEXTAREA_BASE = [
  "w-full min-h-[88px] max-h-[192px] px-md py-sm text-ink text-body",
  "rounded-md border bg-surface-raised transition-all duration-150 ease-out",
  "placeholder:text-ink-muted/60",
  "resize-none overflow-y-auto",
  "focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink",
].join(" ");

const TEXTAREA_COMPACT = [
  "w-full min-h-[48px] max-h-[140px] px-3 py-2 text-ink text-body",
  "rounded-xl border bg-surface-raised transition-all duration-150 ease-out",
  "placeholder:text-ink-muted/50",
  "resize-none overflow-y-auto",
  "focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
].join(" ");

/**
 * Labelled multi-line input mirroring TextField's a11y wiring exactly:
 *
 * - a visible `<label>` bound to the textarea (`useId`-derived id)
 * - `aria-invalid` when `error` is set
 * - `aria-describedby` listing the hint id and the error id
 * - 44px+ touch target (height + padding)
 *
 * Auto-grows from min 88px (or 48px if compact) to max 192px (or 140px); beyond it scrolls
 * internally so the composer never swallows the viewport.
 */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    hint,
    error,
    compact = false,
    labelClassName,
    className,
    id,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-hint`;
  const errorId = `${textareaId}-error`;
  const nativeRef = useRef<HTMLTextAreaElement | null>(null);

  const describedBy = [
    hint === undefined ? null : hintId,
    error === undefined ? null : errorId,
    ariaDescribedBy,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  useEffect(() => {
    const el = nativeRef.current;
    if (!el) return;
    el.style.height = "auto";
    const minHeight = compact ? 48 : 88;
    const maxHeight = compact ? 140 : 192;
    const nextHeight = Math.max(minHeight, el.scrollHeight);
    el.style.height = `${nextHeight}px`;
    if (el.scrollHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "scroll";
    } else {
      el.style.overflowY = "hidden";
    }
  }, [rest.value, rest.defaultValue, compact]);

  const defaultLabelClass = compact
    ? "sr-only"
    : "mb-2xs block text-small font-medium text-ink";

  return (
    <div>
      <label
        htmlFor={textareaId}
        className={labelClassName ?? defaultLabelClass}
      >
        {label}
      </label>
      <textarea
        ref={(node) => {
          nativeRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) {
            (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }
        }}
        id={textareaId}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy}
        className={[
          compact ? TEXTAREA_COMPACT : TEXTAREA_BASE,
          error === undefined ? "border-line" : "border-danger",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {hint === undefined ? null : (
        <div id={hintId} className="mt-2xs text-caption text-ink-muted">
          {hint}
        </div>
      )}
      {error === undefined ? null : (
        <div className="mt-2xs flex items-start gap-2xs">
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

export default TextArea;
