import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Landing() {
  useDocumentTitle("Plan your trip", "AI trip planning — tell us where you want to go");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-md">
      <div className="max-w-prose text-center">
        <p className="text-overline uppercase tracking-[0.12em] text-accent font-semibold mb-sm">
          AI trip planning
        </p>
        <h1 className="font-display text-display font-semibold leading-[1.05] text-ink mb-md text-balance">
          Plan a trip worth the wait.
        </h1>
        <p className="text-lead text-ink-muted leading-[1.55] mb-lg mx-auto max-w-[58ch]">
          Tell us where you want to go. A real agent builds your itinerary — usually in 5 to 15 minutes.
        </p>
        <div className="flex items-center justify-center gap-md flex-wrap">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center min-h-[44px] px-lg py-sm bg-accent text-accent-ink font-semibold rounded-md shadow-sm hover:bg-accent/90 transition-colors"
          >
            Create your free account
          </Link>
          <Link
            to="/signin"
            className="inline-flex items-center justify-center min-h-[44px] px-lg py-sm border border-line text-ink font-semibold rounded-md hover:bg-surface transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
