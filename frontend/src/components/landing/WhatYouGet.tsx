import SectionWrapper from "./SectionWrapper";

export default function WhatYouGet() {
  return (
    <SectionWrapper id="what-you-get" ariaLabelledBy="what-you-get-title">
      <div className="grid grid-cols-1 items-start gap-2xl lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-xs rounded-full border border-line bg-surface px-sm py-2xs mb-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <p className="text-overline font-semibold uppercase tracking-[0.14em] text-accent">
              The output
            </p>
          </div>
          <h2
            id="what-you-get-title"
            className="font-display text-h2 font-semibold text-ink tracking-tight"
          >
            A real plan, not a hallucination.
          </h2>
          <p className="mt-md text-lead leading-[1.65] text-ink-muted">
            Waynora doesn&apos;t spit out generic top-10 lists or promise instant one-click booking.
            Instead, you receive a thoroughly synthesized travel brief containing realistic day-by-day itineraries,
            neighborhood orientation, logistics considerations, and weather forecasts.
          </p>

          <div className="mt-xl space-y-md">
            <div className="flex items-start gap-md rounded-lg border border-line/60 bg-surface/60 p-md transition-colors hover:border-line">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-small font-bold">
                ✓
              </span>
              <div>
                <p className="text-body font-semibold text-ink">Structured Day-by-Day Sequences</p>
                <p className="mt-2xs text-small text-ink-muted leading-relaxed">
                  Chronological morning, afternoon, and evening recommendations that respect physical distances and opening hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-md rounded-lg border border-line/60 bg-surface/60 p-md transition-colors hover:border-line">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-small font-bold">
                ✓
              </span>
              <div>
                <p className="text-body font-semibold text-ink">Logistics & Transit Connections</p>
                <p className="mt-2xs text-small text-ink-muted leading-relaxed">
                  Realistic timings for high-speed rail, regional transit, metro passes, and transfer connections between hubs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-md rounded-lg border border-line/60 bg-surface/60 p-md transition-colors hover:border-line">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-small font-bold">
                ✓
              </span>
              <div>
                <p className="text-body font-semibold text-ink">Honest Planning Baseline</p>
                <p className="mt-2xs text-small text-ink-muted leading-relaxed">
                  A comprehensive, markdown-formatted brief ready to guide your actual bookings without sponsored clutter.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[1.25rem] border border-line bg-surface p-1.5 shadow-sm">
            <div className="rounded-xl border border-line/70 bg-surface-raised p-lg">
              <div className="flex items-center justify-between border-b border-line pb-sm">
                <span className="font-mono text-caption text-ink-muted">itinerary_brief.md</span>
                <span className="rounded-full bg-accent-soft px-sm py-2xs text-[0.7rem] font-semibold uppercase tracking-wider text-accent border border-accent/20">
                  Example structure — not a real Waynora output
                </span>
              </div>

              <div className="mt-md space-y-sm font-mono text-small text-ink leading-relaxed">
                <p className="text-accent font-semibold text-body">
                  # 8 Days in Northern Italy: Milan, Verona, Venice
                </p>
                <div className="space-y-xs text-caption text-ink-muted">
                  <p className="font-semibold text-ink">## Day 1 — Arrival in Milan & Brera Arts District</p>
                  <p>• Morning: Settle in near Porta Garibaldi; espresso in Piazza del Carmine.</p>
                  <p>• Afternoon: Pinacoteca di Brera collection, walk to Duomo rooftop for sunset.</p>
                  <p>• Transit: M3 Metro pass validated (24h unlimited mobility).</p>
                  <p>• Weather check: High 19°C, mild evening; pack light layer.</p>
                </div>

                <div className="pt-sm space-y-xs text-caption text-ink-muted border-t border-line/50">
                  <p className="font-semibold text-ink">## Day 2 — High-Speed Regional Transit to Verona</p>
                  <p>• Morning: Frecciarossa express from Milano Centrale (1h 12m).</p>
                  <p>• Afternoon: Roman Arena, Piazza delle Erbe, Castelvecchio Bridge walk.</p>
                  <p>• Accommodation notes: Historic center within pedestrian zone (ZTL).</p>
                </div>

                <div className="pt-sm text-[0.75rem] italic text-ink-muted/80">
                  [... Complete itinerary continues across all 8 days with transit, district, and weather notes ...]
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
