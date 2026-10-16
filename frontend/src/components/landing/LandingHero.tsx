import { Link } from "react-router-dom";
import { Button } from "../ui";

export default function LandingHero() {
  return (
    <section
      aria-label="Hero"
      className="relative flex min-h-[88vh] items-center overflow-hidden py-2xl md:py-4xl"
    >
      {/* Cinematic travel atmosphere: ambient travel vista & lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      >
        <img
          src="/images/hero-travel.jpg"
          alt=""
          className="h-full w-full object-cover object-center opacity-30 md:opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/90 to-canvas/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-transparent" />
        <div className="absolute -right-24 -top-24 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-gold/5 blur-[100px]" />

        {/* Delicate cartographic compass rose SVG watermark */}
        <svg
          className="absolute -right-20 top-1/2 h-[520px] w-[520px] -translate-y-1/2 opacity-[0.035] md:opacity-[0.05]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="100" cy="100" r="90" strokeWidth="0.5" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="70" strokeWidth="0.75" />
          <circle cx="100" cy="100" r="50" strokeWidth="0.5" />
          <path d="M100 5v190M5 100h190" strokeWidth="0.5" />
          <path d="M100 15l8 75 75 10-75 10-8 75-8-75-75-10 75-10 8-75z" fill="currentColor" fillOpacity="0.08" strokeWidth="0.5" />
        </svg>

        <div className="absolute -right-8 -top-12 opacity-[0.03]">
          <span className="font-display text-[22rem] font-bold tracking-tighter text-ink">
            W
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-container-xl px-md sm:px-lg relative z-10">
        <div className="grid grid-cols-1 items-center gap-2xl lg:grid-cols-12">
          {/* Main Editorial Hero Column */}
          <div className="lg:col-span-7 max-w-[65ch]">
            {/* Double-border luxury badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface-raised/90 px-3.5 py-1 mb-md shadow-2xs backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse-subtle" />
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
                Autonomous Travel Atelier
              </p>
              <span className="h-1 w-1 rounded-full bg-gold" />
              <span className="text-[10px] font-mono tracking-wider text-ink-muted">
                5–15 MIN SYNTHESIS
              </span>
            </div>

            <h1 className="font-display text-display font-semibold tracking-tight text-ink text-balance leading-[1.04]">
              Your trip, planned by a real agent.
            </h1>

            <p className="mt-md max-w-prose text-lead leading-[1.65] text-ink-muted">
              Describe where you want to go. Waynora&apos;s specialist agents research and write
              your complete itinerary — usually in 15 to 20 minutes. No fake progress, no instant hallucinations.
            </p>

            {/* CTAs with Button-in-Button architecture */}
            <div className="mt-xl flex flex-wrap items-center gap-md">
              <Button asChild size="lg" className="rounded-full px-7 py-3.5 text-body font-semibold shadow-luxury hover:shadow-luxury-hover hover:-translate-y-0.5 border border-gold/30">
                <Link to="/signup" aria-label="Plan my trip — create an account" className="group flex items-center gap-2.5">
                  <span>Plan my trip →</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="rounded-full border-line/80 hover:border-gold/60 text-ink bg-surface/70 backdrop-blur-xs px-6 py-3.5 shadow-2xs hover:shadow-xs transition-all"
              >
                <a href="#how-it-works" aria-label="How it works — jump to explanation" className="flex items-center gap-2">
                  <span>How it works ↓</span>
                </a>
              </Button>
            </div>

            {/* Micro-guarantee strip */}
            <div className="mt-2xl flex flex-wrap items-center gap-x-lg gap-y-sm text-caption text-ink-muted border-t border-line/60 pt-lg font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-gold font-bold">✓</span>
                <span>Verified transit & lodging</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gold font-bold">✓</span>
                <span>Zero sponsored clutter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gold font-bold">✓</span>
                <span>Cookie client-side privacy</span>
              </div>
            </div>
          </div>

          {/* Right Floating Dispatch Specimen */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="rounded-2xl border border-line/80 bg-surface-raised/95 p-xl shadow-luxury relative overflow-hidden backdrop-blur-md">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

              {/* Header of the specimen */}
              <div className="flex items-center justify-between border-b border-line pb-md">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                    Live Synthesis Flight
                  </span>
                </div>
                <span className="rounded-full border border-gold/40 bg-gold-soft px-2.5 py-0.5 font-mono text-[10px] font-semibold text-gold-muted uppercase">
                  Concierge Dispatch
                </span>
              </div>

              {/* Sample Journey Card */}
              <div className="mt-md space-y-md">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                    Route Dossier • 10 Days
                  </span>
                  <h3 className="font-display text-h3 font-semibold text-ink mt-0.5">
                    Kyoto, Kanazawa & Tokyo
                  </h3>
                </div>

                <div className="space-y-sm rounded-xl border border-line/60 bg-canvas/60 p-md font-mono text-small">
                  <div className="flex items-center justify-between text-caption text-ink-muted border-b border-line/40 pb-xs">
                    <span>SPECIALIST</span>
                    <span>STATUS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink font-medium">Destination Planner</span>
                    <span className="text-accent text-[11px] font-semibold">✓ Districts mapped</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink font-medium">Transport Agent</span>
                    <span className="text-accent text-[11px] font-semibold">✓ Shinkansen scheduled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink font-medium">Accommodation & Weather</span>
                    <span className="text-accent text-[11px] font-semibold">✓ Ryokan verified</span>
                  </div>
                </div>

                <div className="rounded-xl border border-accent/20 bg-accent-soft/40 p-sm sm:p-md text-caption leading-relaxed text-ink/90">
                  <p className="font-display italic">
                    &ldquo;Morning departure on the Hokuriku Shinkansen Kagayaki. Afternoon stroll through Higashi Chaya geisha district before traditional kaiseki dinner.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
