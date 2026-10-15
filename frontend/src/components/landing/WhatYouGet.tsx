import SectionWrapper from "./SectionWrapper";

export default function WhatYouGet() {
  return (
    <SectionWrapper id="what-you-get" ariaLabelledBy="what-you-get-title">
      <div className="grid grid-cols-1 items-start gap-2xl lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3 py-1 mb-sm shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
              The Output Quality
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
            <div className="flex items-start gap-md rounded-2xl border border-line/70 bg-surface/80 p-md transition-all hover:border-gold/50 hover:shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-small font-bold border border-accent/20 ring-1 ring-gold/30">
                ✓
              </span>
              <div>
                <p className="text-body font-semibold text-ink">Structured Day-by-Day Sequences</p>
                <p className="mt-1 text-small text-ink-muted leading-relaxed">
                  Chronological morning, afternoon, and evening recommendations that respect physical distances and opening hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-md rounded-2xl border border-line/70 bg-surface/80 p-md transition-all hover:border-gold/50 hover:shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-small font-bold border border-accent/20 ring-1 ring-gold/30">
                ✓
              </span>
              <div>
                <p className="text-body font-semibold text-ink">Logistics & Transit Connections</p>
                <p className="mt-1 text-small text-ink-muted leading-relaxed">
                  Realistic timings for high-speed rail, regional transit, metro passes, and transfer connections between hubs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-md rounded-2xl border border-line/70 bg-surface/80 p-md transition-all hover:border-gold/50 hover:shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-small font-bold border border-accent/20 ring-1 ring-gold/30">
                ✓
              </span>
              <div>
                <p className="text-body font-semibold text-ink">Honest Planning Baseline</p>
                <p className="mt-1 text-small text-ink-muted leading-relaxed">
                  A comprehensive, markdown-formatted brief ready to guide your actual bookings without sponsored clutter.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dossier Specimen */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-line/80 bg-surface-raised p-lg sm:p-xl shadow-luxury relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gold/5 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-line pb-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="font-mono text-caption font-semibold text-ink">itinerary_brief.md</span>
              </div>
              <span className="rounded-full bg-accent-soft px-sm py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-accent border border-accent/30 shadow-2xs">
                Example structure — not a real Waynora output
              </span>
            </div>

            <div className="mt-md space-y-md font-mono text-small text-ink leading-relaxed">
              <div className="border-b border-line/40 pb-sm">
                <span className="text-[10px] uppercase tracking-widest text-gold-muted font-bold block mb-1">
                  DESTINATION DOSSIER
                </span>
                <p className="text-accent font-display text-lead font-semibold">
                  # 8 Days in Northern Italy: Milan, Verona, Venice
                </p>
              </div>

              <div className="space-y-xs text-caption text-ink-muted rounded-xl bg-canvas/60 p-sm sm:p-md border border-line/40">
                <p className="font-semibold text-ink flex items-center justify-between">
                  <span>## Day 1 — Arrival in Milan & Brera Arts District</span>
                  <span className="text-gold text-[10px]">VERIFIED</span>
                </p>
                <p className="text-ink/80">• Morning: Settle in near Porta Garibaldi; espresso in Piazza del Carmine.</p>
                <p className="text-ink/80">• Afternoon: Pinacoteca di Brera collection, walk to Duomo rooftop for sunset.</p>
                <p className="text-accent font-medium">• Transit: M3 Metro pass validated (24h unlimited mobility).</p>
                <p className="text-ink-muted">• Weather check: High 19°C, mild evening; pack light layer.</p>
              </div>

              <div className="space-y-xs text-caption text-ink-muted rounded-xl bg-canvas/60 p-sm sm:p-md border border-line/40">
                <p className="font-semibold text-ink flex items-center justify-between">
                  <span>## Day 2 — High-Speed Regional Transit to Verona</span>
                  <span className="text-gold text-[10px]">TIMED LEG</span>
                </p>
                <p className="text-ink/80">• Morning: Frecciarossa express from Milano Centrale (1h 12m).</p>
                <p className="text-ink/80">• Afternoon: Roman Arena, Piazza delle Erbe, Castelvecchio Bridge walk.</p>
                <p className="text-ink-muted">• Accommodation notes: Historic center within pedestrian zone (ZTL).</p>
              </div>

              <div className="pt-2 text-[0.75rem] font-mono text-center text-ink-muted/80 border-t border-line/50 flex items-center justify-center gap-2">
                <span className="text-gold">✦</span>
                <span>[... Complete itinerary continues across all 8 days with transit, district, and weather notes ...]</span>
                <span className="text-gold">✦</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
