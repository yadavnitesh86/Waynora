import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "../auth/useCurrentUser";
import AuthCard from "../components/auth/AuthCard";

/**
 * Open-redirect allowlist for the `next` target: only single-leading-slash
 * relative paths pass. `//evil.com` and `https://evil.com` fail and fall
 * back to `/chat` (TM-03). Exported so the auth forms validate `next` with
 * the exact same expression before navigating after sign-in.
 */
export function isValidNextPath(path: string): boolean {
  return /^\/(?!\/).*$/.test(path);
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthState();

  // Auth still resolving: neutral loading state, never a redirect (TM-05,
  // CONTEXT D-10).
  if (isLoading) {
    return <AuthCard title="Checking your session…" />;
  }

  if (!isAuthenticated) {
    const next = location.pathname + location.search;
    const safeNext = isValidNextPath(next) ? next : "/chat";
    return (
      <Navigate to={`/signin?next=${encodeURIComponent(safeNext)}`} replace />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
