import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface ErrorTextProps extends ComponentPropsWithoutRef<"p"> {
  children: ReactNode;
}

/**
 * Form/status error line: `role="alert"` so it is announced as soon as it
 * appears, coloured with `--color-danger` at the 15px `small` step.
 *
 * Leading-icon-free by design — callers that need a non-colour signal (the
 * a11y contract requires colour is never the only signal) render their own
 * `aria-hidden` icon beside this component, as `TextField` does.
 */
const ErrorText = forwardRef<HTMLParagraphElement, ErrorTextProps>(
  function ErrorText({ children, className, ...rest }, ref) {
    return (
      <p
        ref={ref}
        role="alert"
        className={
          className === undefined
            ? "text-small text-danger"
            : ["text-small text-danger", className].filter(Boolean).join(" ")
        }
        {...rest}
      >
        {children}
      </p>
    );
  },
);

export default ErrorText;
