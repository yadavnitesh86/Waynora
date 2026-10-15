import SectionWrapper from "./SectionWrapper";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      roman: "I",
      title: "Describe your trip",
      desc: "Tell Waynora where you want to go, for how long, and any preferences. A single sentence or detailed requirements work equally well.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      num: "02",
      roman: "II",
      title: "Agents get to work",
      desc: "A Destination Planner, Transport Agent, and AccommodationWeather Agent research your trip simultaneously using live specialized queries.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      num: "03",
      roman: "III",
      title: "Your plan is assembled",
      desc: "The main travel agent synthesises all agent research into a single, cohesive, readable itinerary with daily itineraries and transit details.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      num: "04",
      roman: "IV",
      title: "Read it, then plan the real thing",
      desc: "An honest planning starting point — no booking, no live pricing, no hallucinations. Take the plan and book your real tickets with confidence.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
  ];

  return (
    <SectionWrapper id="how-it-works" ariaLabelledBy="how-it-works-title">
      <div className="max-w-[48rem]">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3 py-1 mb-xs shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
            The Planning Process
          </p>
        </div>
        <h2
          id="how-it-works-title"
          className="mt-xs font-display text-h2 font-semibold text-ink tracking-tight"
        >
          From idea to itinerary
        </h2>
        <p className="mt-sm text-lead text-ink-muted leading-[1.65]">
          Waynora breaks complex travel planning into deliberate specialist tasks rather than
          generating generic, hallucinated lists in two seconds.
        </p>
      </div>

      <div className="mt-2xl grid grid-cols-1 gap-lg md:grid-cols-2 lg:gap-xl">
        {steps.map((step) => (
          <div
            key={step.num}
            className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-surface p-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-luxury"
          >
            <div>
              <div className="flex items-center justify-between border-b border-line/60 pb-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/20 transition-transform duration-300 group-hover:scale-105 group-hover:bg-accent group-hover:text-accent-ink">
                    {step.icon}
                  </span>
                  <span className="font-mono text-caption text-ink-muted font-semibold tracking-wider">
                    STAGE {step.roman}
                  </span>
                </div>
                <span className="font-display text-h2 font-bold text-accent/30 transition-colors group-hover:text-gold">
                  {step.num}
                </span>
              </div>

              <h3 className="mt-lg font-sans text-h3 font-semibold text-ink tracking-tight">
                {step.title}
              </h3>
              <p className="mt-sm text-body leading-[1.65] text-ink-muted">
                {step.desc}
              </p>
            </div>

            <div className="mt-lg pt-sm border-t border-line/40 flex items-center justify-between text-[11px] font-mono text-ink-muted/70">
              <span>VERIFIED EXECUTION</span>
              <span className="text-gold font-semibold">
                ✦ AUTONOMOUS
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
