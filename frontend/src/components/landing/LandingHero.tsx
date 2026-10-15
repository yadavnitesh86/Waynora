import { Link } from "react-router-dom";
import { Button } from "../ui";

export default function LandingHero() {
  return (
    <section
      aria-label="Hero"
      className="relative flex min-h-[85vh] items-center overflow-hidden py-2xl md:py-4xl"
    >
      {/* Decorative cartographic watermark in background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 select-none opacity-[0.03] md:opacity-[0.04]"
      >
        <span className="font-display text-[18rem] md:text-[24rem] font-bold tracking-tighter text-ink">
          W
        </span>
      </div>

      <div className="mx-auto w-full max-w-container-xl px-md">
        <div className="max-w-[70ch]">
          <div className="inline-flex items-center gap-xs rounded-full border border-line bg-surface/80 px-sm py-2xs mb-md shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse-subtle" />
            <p className="text-overline font-semibold uppercase tracking-[0.14em] text-accent">
              AI travel planning
            </p>
          </div>

          <h1 className="font-display text-display font-semibold tracking-tight text-ink text-balance">
            Your trip, planned by a real agent.
          </h1>

          <p className="mt-md max-w-prose text-lead leading-[1.6] text-ink-muted">
            Describe where you want to go. Waynora&apos;s specialist agents research and write
            your complete itinerary — usually in 5 to 15 minutes. No fake progress, no instant hallucinations.
          </p>

          <div className="mt-xl flex flex-wrap items-center gap-md">
            <Button asChild size="lg" className="px-xl text-body font-semibold shadow-sm hover:shadow-md">
              <Link to="/signup" aria-label="Plan my trip — create an account">
                Plan my trip →
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="border-line/80 hover:border-ink-muted text-ink"
            >
              <a href="#how-it-works" aria-label="How it works — jump to explanation">
                How it works ↓
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
