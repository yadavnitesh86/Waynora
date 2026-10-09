import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useDocumentTitle } from "../lib/useDocumentTitle";

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
    <div className="flex min-h-[80vh] items-center justify-center px-md">
      <div className="max-w-prose text-center">
        <h1 className="font-display text-h1 font-semibold text-ink mb-md text-balance">
          Your trip goes here
        </h1>
        <p className="text-lead text-ink-muted leading-[1.55] mb-lg">
          Chat and your generated travel plans arrive in Phase 3. Nothing to
          show yet.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="min-h-[44px] px-lg py-sm border border-line text-ink font-semibold rounded-md hover:bg-surface transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
