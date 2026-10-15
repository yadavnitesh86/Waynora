import { cloneElement, forwardRef, isValidElement } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
} from "react";
import Spinner from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button props extend the native `<button>` attributes so every DOM control
 * (type, name, form, aria-*, data-*) keeps working. Two render modes:
 *
 * - default: `<button type="button">`
 * - anchor: pass `href`, or `asChild` with a single `<a>`/`<Link>` child
 *
 * `asChild` merges the computed class list into the child element instead of
 * rendering our own anchor, so React Router `<Link>` navigation semantics are
 * preserved (no Radix dependency — D-02).
 */
export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-busy" | "children"
  > {
  /** Visual weight. Primary is the only accent-filled style (UI-SPEC). */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows the Spinner, sets `aria-busy`, and disables the control. */
  isSubmitting?: boolean;
  /** Render as a plain anchor with this href. */
  href?: string;
  /** Render as the single element child, merging our props into it. */
  asChild?: boolean;
  children?: ReactNode;
}

const BASE = [
  "inline-flex items-center justify-center gap-xs",
  "rounded-md font-semibold select-none",
  "transition-all duration-150 ease-out",
  "active:scale-[0.98]",
  "focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
].join(" ");

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink border border-transparent shadow-xs hover:shadow-md hover:-translate-y-[1px] active:translate-y-0",
  secondary:
    "bg-transparent text-ink border border-line hover:border-ink-muted hover:bg-surface active:translate-y-[1px]",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-ink/5 active:bg-ink/10",
};

// Every size keeps the 44px minimum touch target from the a11y contract.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-sm text-small",
  md: "min-h-[44px] px-md text-body",
  lg: "min-h-[52px] px-lg text-body",
};

const DISABLED = "disabled:opacity-60 disabled:cursor-not-allowed";

function joinClasses(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

type AnyMouseEvent = MouseEvent<HTMLElement>;

function composeHandlers(
  ...handlers: Array<((event: AnyMouseEvent) => void) | undefined>
) {
  const defined = handlers.filter(
    (handler): handler is (event: AnyMouseEvent) => void =>
      typeof handler === "function",
  );
  if (defined.length <= 1) {
    return defined[0];
  }
  return (event: AnyMouseEvent) => {
    for (const handler of defined) {
      handler(event);
    }
  };
}

function ButtonInner(
  {
    variant = "primary",
    size = "md",
    isSubmitting = false,
    href,
    asChild = false,
    className,
    children,
    disabled,
    onClick,
    type,
    ...rest
  }: ButtonProps,
  ref: Ref<HTMLButtonElement | HTMLAnchorElement>,
) {
  const computed = joinClasses(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    DISABLED,
    className,
  );
  const isDisabled = disabled === true || isSubmitting;
  const ariaBusy = isSubmitting ? true : undefined;

  // Two-part loading treatment:
  // - the visible spinner is hidden from assistive tech (its own
  //   aria-label must not leak into the control's accessible name)
  // - a sibling `role="status"` region carries the polite announcement
  const visualSpinner = isSubmitting ? (
    <span aria-hidden="true" className="inline-flex">
      <Spinner size={size} />
    </span>
  ) : null;
  const announcement = isSubmitting ? (
    <Spinner size={size} className="sr-only" />
  ) : null;

  const handleClick = (event: AnyMouseEvent) => {
    if (isDisabled) {
      // Never let a disabled control activate.
      event.preventDefault();
      return;
    }
    // Cast once: the handler is declared button-shaped but receives the real
    // (button or anchor) event at runtime.
    (onClick as ((event: AnyMouseEvent) => void) | undefined)?.(event);
  };

  // asChild: adopt a single element child (e.g. <Link>) and merge props in.
  // The child's own children become the label; the spinner is prepended.
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    const childProps = child.props;
    const childClassName =
      typeof childProps.className === "string" ? childProps.className : undefined;
    const childOnClick = childProps.onClick as
      | ((event: AnyMouseEvent) => void)
      | undefined;    return (
      <>
        {cloneElement(child, {
          ref,
          className: joinClasses(computed, childClassName),
          "aria-busy": ariaBusy,
          "aria-disabled": isDisabled ? true : undefined,
          onClick: composeHandlers(childOnClick, handleClick),
          children: (
            <>
              {visualSpinner}
              <span className="inline-flex items-center gap-xs">
                {childProps.children as ReactNode}
              </span>
            </>
          ),
        } as Partial<unknown>)}
        {announcement}
      </>
    );
  }

  if (href !== undefined) {
    return (
      <>
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          className={computed}
          aria-busy={ariaBusy}
          aria-disabled={isDisabled ? true : undefined}
          onClick={handleClick}
          // Button props are declared button-shaped; the shared DOM attributes
          // (id, data-*, aria-*) are valid on an anchor too.
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {visualSpinner}
          <span className="inline-flex items-center gap-xs">{children}</span>
        </a>
        {announcement}
      </>
    );
  }

  return (
    <>
      <button
        ref={ref as Ref<HTMLButtonElement>}
        // Buttons never submit implicitly; forms pass type="submit" explicitly.
        type={type ?? "button"}
        className={computed}
        disabled={isDisabled}
        aria-busy={ariaBusy}
        onClick={handleClick}
        {...rest}
      >
        {visualSpinner}
        <span className="inline-flex items-center gap-xs">{children}</span>
      </button>
      {announcement}
    </>
  );
}

/**
 * Accessible button with three accent-restrained variants and three sizes that
 * all keep the 44px touch target. Loading renders the `role="status"` Spinner
 * plus `aria-busy` and disables the control.
 */
const Button = forwardRef(ButtonInner);

export default Button;
