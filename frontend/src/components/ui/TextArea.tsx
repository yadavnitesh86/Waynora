import { forwardRef, useId, useRef, useEffect } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ErrorText from "./ErrorText";

export interface TextAreaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "children"> {
  label: string;
  hint?: ReactNode;
  error?: string;
}

const TEXTAREA_BASE = [
  "w-full min-h-[88px] max-h-[192px] px-md py-sm text-ink",
  "rounded-md border bg-surface-raised",
  "resize-none overflow-y-auto",
].join(" ");

/**
 * Labelled multi-line input mirroring TextField's a11y wiring exactly:
 *
 * - a visible `<label>` bound to the textarea (`useId`-derived id)
 * - `aria-invalid` when `error` is set
 * - `aria-describedby` listing the hint id and the error id
 * - 44px+ touch target (height + padding)
 *
 * Auto-grows from min 88px to max 192px (D-34); beyond 192px it scrolls
 * internally so the composer never swallows the viewport.
 */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, className, id, "aria-describedby": ariaDescribedBy, ...rest },
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
    el.style.height = `${el.scrollHeight}px`;
    if (el.scrollHeight > 192) {
      el.style.height = "192px";
      el.style.overflowY = "scroll";
    } else {
      el.style.overflowY = "hidden";
    }
  }, [rest.value, rest.defaultValue]);

  return (
    <div>
      <label
        htmlFor={textareaId}
        className="mb-2xs block text-small font-medium text-ink"
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
          TEXTAREA_BASE,
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
