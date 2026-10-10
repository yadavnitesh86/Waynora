import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { Button, PageHeader } from "../components/ui";

/**
 * Phase 1 chat placeholder. Sign-out is fully wired; everything else arrives
 * in Phase 3 with the real chat surface.
 *
 * Composition note: the plan suggested the `EmptyState` primitive here, but its
 * title is an `<h3>` by contract and this is a full page — using it alone would
 * leave the route without an `<h1>` and break heading order. The page heading
 * therefore comes from `PageHeader` (the primitive that owns route `<h1>`s);
 * `EmptyState` stays available for the in-page empty state Phase 3 renders.
 */
export default function ChatPlaceholder() {
  useDocumentTitle("Chat", "Your trip planning chat");
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      // TM-06: unmount protected content via the route change.
      navigate("/", { replace: true });
    } catch {
      // Session could not be cleared — stay put rather than misreport
      // a sign-out. No raw error text is ever rendered.
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center px-md py-3xl">
      <div className="mx-auto w-full max-w-container-xl">
        <PageHeader
          title="Your trip goes here"
          lede="Chat and your generated travel plans arrive in Phase 3. Nothing to show yet."
          actions={
            <Button variant="secondary" onClick={handleSignOut}>
              Sign out
            </Button>
          }
        />
      </div>
    </div>
  );
}
