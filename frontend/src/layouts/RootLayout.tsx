import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuthState } from "../auth/useCurrentUser";
import { SkipLink } from "../components/ui";

function navItemClass(isActive: boolean): string {
  return [
    "inline-flex items-center min-h-[44px] px-sm text-small font-medium",
    "border-l-2 transition-colors duration-150 ease-out",
    isActive ? "border-accent text-accent" : "border-transparent text-ink hover:text-accent",
  ].join(" ");
}

/**
 * The app shell: skip link, header with wordmark + primary nav, the `<main>`
 * landmark, and the footer.
 *
 * Accessibility contract (D-14):
 * - `SkipLink` is the FIRST focusable element in the document
 * - `<main id="main" tabIndex={-1}>` so the skip link can move focus into it
 * - exactly one `<header>`, one `<main>`, one `<footer>` per route
 * - no positive `tabindex` anywhere; DOM order is the focus order
 */
export default function RootLayout() {
  const { isAuthenticated } = useAuthState();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      // TM-06: unmount protected content via the route change.
      navigate("/", { replace: true });
    } catch {
      // Session could not be cleared — stay put rather than misreport a
      // sign-out. No raw error text is ever rendered.
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SkipLink />

      <header className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-container-xl px-md">
          <div className="flex min-h-3xl items-center justify-between gap-md">
            <Link
              to="/"
              className="font-display text-h3 font-semibold text-ink"
            >
              Waynora
            </Link>

            <nav aria-label="Primary" className="flex items-center gap-2xs">
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/chat"
                    className={({ isActive }) => navItemClass(isActive)}
                  >
                    Chat
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={navItemClass(false)}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/signin"
                    className={({ isActive }) => navItemClass(isActive)}
                  >
                    Sign in
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className={({ isActive }) => navItemClass(isActive)}
                  >
                    Create account
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1"
      >
        <Outlet />
      </main>

      {/* Phase 5 owns the full footer composition; the wordmark keeps the
          landmark complete and the page framed for now. */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-container-xl px-md py-lg">
          <p className="text-caption text-ink-muted">Waynora</p>
        </div>
      </footer>
    </div>
  );
}
