import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuthState } from "../auth/useCurrentUser";
import { SkipLink } from "../components/ui";

function navItemClass(isActive: boolean): string {
  return [
    "inline-flex items-center min-h-[44px] px-sm text-small font-medium relative",
    "transition-colors duration-150 ease-out",
    isActive ? "text-accent font-semibold" : "text-ink hover:text-accent",
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
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <SkipLink />

      <header className="border-b border-line bg-surface/90 backdrop-blur-xs sticky top-0 z-40 transition-colors">
        <div className="mx-auto w-full max-w-container-xl px-md">
          <div className="flex min-h-[56px] items-center justify-between gap-md py-xs">
            <Link
              to="/"
              className="flex items-center gap-sm group focus-visible:outline-2 focus-visible:outline-focus rounded-sm"
              aria-label="Waynora home"
            >
              <img
                src="/logo.png"
                alt="Waynora Logo"
                className="h-8 w-8 object-contain rounded-md transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-display text-h3 font-semibold text-ink tracking-tight">
                Waynora
              </span>
            </Link>

            <nav aria-label="Primary" className="flex items-center gap-xs">
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
                    className="inline-flex items-center min-h-[44px] px-sm text-small font-medium text-ink-muted hover:text-ink transition-colors"
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
                    className="inline-flex items-center justify-center min-h-[38px] px-md rounded-md bg-accent text-accent-ink text-small font-semibold shadow-xs hover:shadow-sm hover:-translate-y-[0.5px] transition-all"
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
        className="flex-1 focus:outline-none"
      >
        <Outlet />
      </main>

      {/* Surface 1: Shell Footer — verified GitHub attribution (LAND-05) */}
      <footer className="border-t border-line bg-surface mt-auto">
        <div className="mx-auto w-full max-w-container-xl px-md py-2xl">
          <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-xs">
              <div className="flex items-center gap-sm">
                <img
                  src="/logo.png"
                  alt="Waynora Logo"
                  className="h-6 w-6 object-contain rounded-sm opacity-90"
                />
                <p className="font-display text-h3 font-semibold text-ink">Waynora</p>
              </div>
              <p className="text-small text-ink-muted">AI-powered travel planning</p>
            </div>
            <p className="text-caption text-ink-muted">
              Made by{" "}
              <a
                href="https://github.com/yadavnitesh86"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YADAV NITESH's GitHub profile"
                className="text-accent font-semibold underline underline-offset-2 hover:text-ink transition-colors"
              >
                YADAV NITESH
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
