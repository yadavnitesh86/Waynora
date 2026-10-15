import { Component, type ErrorInfo, type ReactNode } from "react";
import { isDev } from "./lib/env";
import Button from "./components/ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort render guard.
 *
 * Without this, any render-time throw unmounts the entire tree and the user
 * sees a blank white page with no explanation. With it, the failure is visible
 * and actionable. Removed from the happy path entirely - it renders children
 * unchanged when nothing has thrown.
 *
 * D-37 / QUAL-01: the diagnostic pre block (error.message + stack) renders
 * ONLY when isDev is true. In a production build the UI never shows a raw
 * traceback - it renders the customer-safe production panel instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Console only - never rendered into a product surface in production.
    console.error("[Waynora] render failure", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }

    // D-37 / QUAL-01: in production, render the customer-safe panel.
    // Raw tracebacks and internal stack dumps never reach the UI.
    if (!isDev) {
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center bg-canvas px-md py-3xl text-ink"
        >
          <div className="w-full max-w-[32rem] rounded-[1.5rem] border border-line bg-surface p-xl sm:p-2xl text-center shadow-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger mb-md">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="font-display text-h2 font-semibold text-ink">
              Something unexpected happened.
            </h1>
            <p className="mt-sm text-body text-ink-muted leading-relaxed">
              Something went wrong on our side. Reload the page to try again.
            </p>
            <div className="mt-xl flex justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={() => window.location.reload()}
              >
                Reload the page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center bg-canvas px-md py-2xl font-sans"
      >
        <div className="w-full max-w-container-lg rounded-xl border border-line bg-surface p-lg shadow-sm">
          <p className="text-overline font-semibold uppercase tracking-[0.14em] text-danger">
            Development Error Surface
          </p>
          <h1 className="mt-xs text-h2 font-semibold text-ink">
            Something in the app threw during render
          </h1>
          <p className="mt-sm text-body text-ink-muted">
            This is a development diagnostic view (suppressed in production builds).
          </p>
          <pre className="mt-md overflow-auto whitespace-pre-wrap rounded-md border border-line bg-canvas p-md text-caption text-ink font-mono">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
          <div className="mt-lg">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload the page
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
