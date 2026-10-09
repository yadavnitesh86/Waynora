import { Link, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function LoginPlaceholder() {
  const { pathname } = useLocation();
  const isSignup = pathname === "/signup";

  useDocumentTitle(
    isSignup ? "Create your account" : "Sign in",
    isSignup ? "Create your Waynora account" : "Sign in to Waynora",
  );

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-md">
      <div className="w-full max-w-[28rem] bg-surface rounded-lg shadow-sm p-xl border border-line">
        <h1 className="font-display text-h1 font-semibold text-ink mb-lg">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <div className="flex flex-col gap-md">
          <div>
            <label htmlFor="email" className="block text-small font-medium text-ink mb-2xs">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full min-h-[44px] px-md py-sm border border-line rounded-md bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-focus"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-small font-medium text-ink mb-2xs">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="w-full min-h-[44px] px-md py-sm border border-line rounded-md bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-focus"
              placeholder="••••••••"
            />
            {isSignup && (
              <p className="text-caption text-ink-muted mt-2xs">At least 8 characters.</p>
            )}
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-lg py-sm bg-accent text-accent-ink font-semibold rounded-md shadow-sm hover:bg-accent/90 transition-colors"
          >
            {isSignup ? "Create account" : "Sign in"}
          </button>
        </div>
        <p className="text-small text-ink-muted mt-lg text-center">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link to="/signin" className="text-accent underline underline-offset-2 hover:text-ink">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-accent underline underline-offset-2 hover:text-ink">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
