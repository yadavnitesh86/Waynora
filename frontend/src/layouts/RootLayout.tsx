import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuthState, useCurrentUser } from "../auth/useCurrentUser";
import { SkipLink } from "../components/ui";

function navItemClass(isActive: boolean): string {
  return [
    "inline-flex items-center min-h-[44px] px-md py-xs text-small font-medium relative rounded-full",
    "transition-all duration-200 ease-out",
    isActive
      ? "text-accent font-semibold bg-accent-soft/70 shadow-2xs"
      : "text-ink-muted hover:text-ink hover:bg-surface-raised/80",
  ].join(" ");
}

/**
 * The luxury app shell: skip link, header with bespoke wordmark + primary nav
 * and handcrafted user profile section, the `<main>` landmark, and the editorial footer.
 *
 * Accessibility contract (D-14):
 * - `SkipLink` is the FIRST focusable element in the document
 * - `<main id="main" tabIndex={-1}>` so the skip link can move focus into it
 * - exactly one `<header>`, one `<main>`, one `<footer>` per route
 * - no positive `tabindex` anywhere; DOM order is the focus order
 */
export default function RootLayout() {
  const { isAuthenticated } = useAuthState();
  const user = useCurrentUser();
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

  // Derive initial for personal monogram badge
  const userInitial = (user?.email?.[0] ?? user?.name?.[0] ?? "W").toUpperCase();
  const userDisplay = user?.email ?? "Explorer";

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas text-ink antialiased selection:bg-accent selection:text-accent-ink overflow-x-hidden">
      <SkipLink />

      {/* Ambient Multi-Stop Background Canvas (Luxury Atelier Atmosphere) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Top-center champagne aura */}
        <div className="absolute -top-[120px] left-1/2 h-[560px] w-[950px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(200,169,126,0.35),transparent_70%)] blur-2xl" />
        {/* Right twilight-navy horizon aura */}
        <div className="absolute top-[20%] -right-[120px] h-[650px] w-[650px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(22,42,69,0.14),transparent_65%)] blur-3xl" />
        {/* Bottom-left warm cashmere aura */}
        <div className="absolute bottom-[5%] -left-[150px] h-[550px] w-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(200,169,126,0.26),transparent_65%)] blur-3xl" />
        {/* Subtle silk grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#C8A97E_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-[0.22]" />
      </div>

      {/* Floating luxury frosted glass header */}
      <header className="sticky top-0 z-40 border-b border-gold/25 bg-surface/80 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(22,42,69,0.05)] transition-all">
        <div className="mx-auto w-full max-w-container-xl px-md sm:px-lg">
          <div className="flex min-h-[64px] items-center justify-between gap-md py-xs">
            {/* Brand Wordmark & Atelier Lockup */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="group flex items-center gap-sm rounded-lg p-1 transition-transform focus-visible:outline-2 focus-visible:outline-focus"
                aria-label="Waynora home"
              >
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gold/40 bg-surface-raised p-1 shadow-2xs transition-all duration-300 group-hover:border-gold group-hover:shadow-sm">
                  <img
                    src="/logo.png"
                    alt="Waynora Logo"
                    className="h-7 w-7 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="font-display text-h3 font-semibold tracking-tight text-ink">
                  Waynora
                </span>
              </Link>
              <span className="hidden sm:inline-flex items-center rounded-full border border-gold/30 bg-gold-soft/80 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider text-gold-muted uppercase">
                Atelier
              </span>
            </div>

            {/* Center: Luxury Concierge Status Badge */}
            <div className="hidden lg:flex items-center gap-2.5 rounded-full border border-gold/30 bg-surface/80 px-3.5 py-1 backdrop-blur-md shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-ink-muted font-medium">
                Autonomous Travel Intelligence
              </span>
              <span className="text-gold/60">•</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-gold-muted">
                Bespoke Atelier
              </span>
            </div>

            {/* Navigation & Personal User Profile Area */}
            <nav aria-label="Primary" className="flex items-center gap-sm">
              {isAuthenticated ? (
                <div className="flex items-center gap-sm sm:gap-md">
                  <NavLink
                    to="/chat"
                    className={({ isActive }) => navItemClass(isActive)}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Chat
                    </span>
                  </NavLink>

                  {/* Clean, Non-Boxy Luxury User Capsule */}
                  <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-surface/90 py-1 pl-1.5 pr-2.5 shadow-2xs backdrop-blur-md transition-all hover:border-gold/50">
                    <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-ink shadow-xs ring-1 ring-gold/40">
                      {userInitial}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface bg-success"
                        title="Active Private Session"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="hidden sm:flex flex-col text-left max-w-[130px]">
                      <span className="truncate text-caption font-medium text-ink leading-tight">
                        {userDisplay}
                      </span>
                      <span className="text-[9px] font-mono tracking-wider text-gold-muted uppercase font-semibold">
                        Explorer
                      </span>
                    </div>

                    <div className="h-4 w-px bg-line/80 mx-0.5 hidden sm:block" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex min-h-[28px] items-center justify-center rounded-full px-2.5 text-caption font-medium text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors focus-visible:outline-2 focus-visible:outline-focus"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-xs sm:gap-sm">
                  <NavLink
                    to="/signin"
                    className={({ isActive }) => navItemClass(isActive)}
                  >
                    Sign in
                  </NavLink>

                  {/* Button-in-Button Luxury CTA */}
                  <NavLink
                    to="/signup"
                    className="group inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-gold/30 bg-accent px-md py-1.5 text-small font-semibold text-accent-ink shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-gold"
                  >
                    <span>Create account</span>
                  </NavLink>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="relative z-10 flex-1 focus:outline-none"
      >
        <Outlet />
      </main>

      {/* Surface 1: Shell Footer — verified GitHub attribution (LAND-05) */}
      <footer className="relative z-10 border-t border-line/80 bg-surface-dark text-ink-inverse mt-auto transition-colors">
        <div className="mx-auto w-full max-w-container-xl px-md py-3xl">
          <div className="flex flex-col gap-xl md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-xs max-w-[42ch]">
              <div className="flex items-center gap-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-gold/40 bg-surface-dark-raised p-1 shadow-2xs">
                  <img
                    src="/logo.png"
                    alt="Waynora Logo"
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <p className="font-display text-h3 font-semibold text-ink-inverse tracking-tight">
                  Waynora
                </p>
                <span className="rounded-full border border-gold/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-gold">
                  Atelier
                </span>
              </div>
              <p className="text-small text-ink-inverse-muted">AI-powered travel planning</p>
              <p className="text-caption text-ink-inverse-muted/80 mt-1 leading-relaxed">
                Coordinated autonomous specialists researching realistic itineraries without hallucinations.
              </p>
              <div className="flex items-center gap-md mt-sm text-[11px] font-mono text-gold-muted/80">
                <span>35°41′N 139°41′E</span>
                <span>•</span>
                <span>45°26′N 9°11′E</span>
                <span>•</span>
                <span>48°51′N 2°21′E</span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-sm border-t border-line/10 pt-lg md:border-t-0 md:pt-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-surface-dark-raised/80 px-sm py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-subtle" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-inverse-muted">
                  Autonomous Multi-Agent Synthesis
                </span>
              </div>
              <p className="text-caption text-ink-inverse-muted">
                Made by{" "}
                <a
                  href="https://github.com/yadavnitesh86"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YADAV NITESH's GitHub profile"
                  className="font-semibold text-gold underline underline-offset-4 decoration-gold/50 transition-colors hover:text-ink-inverse hover:decoration-gold"
                >
                  YADAV NITESH
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
