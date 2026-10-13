/**
 * The single primitive layer (CONTEXT D-04). Every surface — landing, auth,
 * chat, waiting, 404 — composes these eight components and nothing else, so
 * there is exactly one place where label wiring, focus behaviour, loading
 * states, and colour choices live.
 *
 * Primitive types are re-exported alongside the components.
 */
export { default as Button } from "./Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./Button";
export { default as TextField } from "./TextField";
export type { TextFieldProps } from "./TextField";
export { default as ErrorText } from "./ErrorText";
export type { ErrorTextProps } from "./ErrorText";
export { default as Spinner } from "./Spinner";
export type { SpinnerProps, SpinnerSize } from "./Spinner";
export { default as EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";
export { default as VisuallyHidden } from "./VisuallyHidden";
export type { VisuallyHiddenProps } from "./VisuallyHidden";
export { default as SkipLink } from "./SkipLink";
export type { SkipLinkProps } from "./SkipLink";
export { default as PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";
export { default as TextArea } from "./TextArea";
export type { TextAreaProps } from "./TextArea";
