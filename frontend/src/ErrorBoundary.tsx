import { Component, type ErrorInfo, type ReactNode } from "react";

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
 * Deliberately does NOT touch the /ask error contract: this is a developer
 * surface for crashes, not a user-facing product error. Copy here is written
 * for the person debugging, not for an end user.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Console only - never rendered into a product surface.
    console.error("[Waynora] render failure", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-md bg-canvas px-md font-sans"
      >
        <div className="w-full max-w-container-lg border border-line bg-surface p-lg">
          <p className="text-small font-medium text-ink-muted">
            Waynora failed to start
          </p>
          <h1 className="mt-xs text-h2 font-semibold text-ink">
            Something in the app threw during render
          </h1>
          <p className="mt-md text-body text-ink-muted">
            This is a development error surface. The message below is the real
            cause - report it or paste it back into the session.
          </p>
          <pre className="mt-md overflow-auto whitespace-pre-wrap border border-line bg-canvas p-md text-caption text-ink">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
        </div>
      </div>
    );
  }
}
