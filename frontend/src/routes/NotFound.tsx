import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-md">
      <div className="max-w-prose text-center">
        <h1 className="font-display text-h1 font-semibold text-ink mb-md">
          Page not found
        </h1>
        <p className="text-lead text-ink-muted leading-[1.55] mb-lg">
          We couldn&apos;t find that page. Head back home to start a trip.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center min-h-[44px] px-lg py-sm bg-accent text-accent-ink font-semibold rounded-md shadow-sm hover:bg-accent/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
