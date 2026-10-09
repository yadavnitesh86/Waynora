import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthenticated = false; // hardcoded for Phase 1, replaced in plan 01-02

  if (!isAuthenticated) {
    const next = location.pathname + location.search;
    const safeNext = /^\/(?!\/).*$/.test(next) ? next : "/chat";
    return <Navigate to={`/signin?next=${encodeURIComponent(safeNext)}`} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
