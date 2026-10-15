import SectionWrapper from "./SectionWrapper";

export default function AgentCards() {
  const agents = [
    {
      name: "Destination Planner",
      role: "Culture, sights & seasonality",
      badge: "CURATION ATELIER",
      desc: "Researches your destination: key attractions, distinct neighbourhoods, local customs, and seasonal timing.",
      features: ["Neighborhood zoning", "Cultural landmarks", "Seasonal crowd rhythms"],
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      name: "Transport Agent",
      role: "Ground, rail & air logistics",
      badge: "LOGISTICS ENGINE",
      desc: "Calculates realistic transport: flights, intercity trains, local metro lines, and transfers between daily locations.",
      features: ["High-speed rail booking windows", "Intercity connections", "Metro pass validation"],
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M8 20l2-2h4l2 2" />
          <path d="M3 13h18" />
          <circle cx="7" cy="16" r="1" />
          <circle cx="17" cy="16" r="1" />
        </svg>
      ),
    },
    {
      name: "AccommodationWeather Agent",
      role: "Stay locations & climate",
      badge: "CLIMATE & HAVEN",
      desc: "Evaluates neighborhood comfort, lodging criteria, and typical weather patterns across your specified travel window.",
      features: ["Microclimate forecasting", "Boutique haven selection", "District walkability"],
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
          <path d="M19 13a3 3 0 0 0-3-3 4 4 0 0 0-7.8 1" />
        </svg>
      ),
    },
  ];

  return (
    <SectionWrapper id="agents" ariaLabelledBy="agents-title">
      <div className="max-w-[48rem]">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3 py-1 mb-xs shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
            Coordinated Specialists
          </p>
        </div>
        <h2
          id="agents-title"
          className="mt-xs font-display text-h2 font-semibold text-ink tracking-tight"
        >
          Three specialists. One plan.
        </h2>
        <p className="mt-sm text-lead text-ink-muted leading-[1.65]">
          Rather than relying on generic single-prompt guesses, Waynora coordinates dedicated
          specialist agents that focus on distinct operational dimensions of your journey.
        </p>
      </div>

      <div className="mt-2xl grid grid-cols-1 gap-lg md:grid-cols-3">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-surface p-xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-luxury"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-13 w-13 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent shadow-2xs transition-all duration-300 group-hover:border-gold group-hover:bg-accent group-hover:text-accent-ink group-hover:scale-105">
                  {agent.icon}
                </div>
                <span className="rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 font-mono text-[9px] font-semibold text-gold-muted uppercase tracking-wider">
                  {agent.badge}
                </span>
              </div>

              <h3 className="mt-xl font-sans text-h3 font-semibold text-ink tracking-tight">
                {agent.name}
              </h3>
              <p className="text-small font-semibold text-accent mt-0.5">
                {agent.role}
              </p>
              <p className="mt-sm text-body leading-[1.65] text-ink-muted">
                {agent.desc}
              </p>
            </div>

            <div className="mt-lg border-t border-line/50 pt-md">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink-muted/80 mb-2">
                Specialist Scope:
              </p>
              <ul className="space-y-1.5 text-caption text-ink-muted">
                {agent.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <span className="text-gold text-[10px]">✦</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
