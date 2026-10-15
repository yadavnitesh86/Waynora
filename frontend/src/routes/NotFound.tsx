import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { Button } from "../components/ui";

export default function NotFound() {
  useDocumentTitle("Page not found", "We couldn't find that page.");

  return (
    <div className="relative flex min-h-[75vh] items-center justify-center overflow-hidden px-md py-3xl text-center">
      {/* Large decorative serif "404" behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute select-none opacity-[0.06] md:opacity-[0.08]"
      >
        <span className="font-display text-[14rem] sm:text-[20rem] font-bold tracking-tighter text-accent">
          404
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-prose">
        <p className="text-overline font-semibold uppercase tracking-[0.16em] text-accent mb-xs">
          Lost at sea
        </p>
        <h1 className="font-display text-h1 font-semibold text-ink tracking-tight">
          Page not found
        </h1>
        <p className="mt-sm text-lead text-ink-muted leading-relaxed">
          We couldn&apos;t find that page. Head back home to start a trip.
        </p>
        <div className="mt-xl flex justify-center">
          <Button asChild size="lg" className="px-xl shadow-xs hover:shadow-sm">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
