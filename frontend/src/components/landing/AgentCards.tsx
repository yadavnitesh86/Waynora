import SectionWrapper from "./SectionWrapper";

export default function AgentCards() {
  const agents = [
    {
      name: "Destination Planner",
      role: "Culture, sights & seasonality",
      desc: "Researches your destination: key attractions, distinct neighbourhoods, local customs, and seasonal timing.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-accent"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      name: "Transport Agent",
      role: "Ground, rail & air logistics",
      desc: "Calculates realistic transport: flights, intercity trains, local metro lines, and transfers between daily locations.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-accent"
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
      desc: "Evaluates neighborhood comfort, lodging criteria, and typical weather patterns across your specified travel window.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-accent"
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
        <p className="text-overline font-semibold uppercase tracking-[0.14em] text-accent">
          Under the hood
        </p>
        <h2
          id="agents-title"
          className="mt-xs font-display text-h2 font-semibold text-ink"
        >
          Three specialists. One plan.
        </h2>
        <p className="mt-sm text-lead text-ink-muted">
          Rather than relying on generic single-prompt guesses, Waynora coordinates dedicated
          specialist agents that focus on distinct operational dimensions of your journey.
        </p>
      </div>

      <div className="mt-2xl grid grid-cols-1 gap-lg md:grid-cols-3">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="flex flex-col rounded-lg border border-line bg-surface p-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-soft">
              {agent.icon}
            </div>
            <h3 className="mt-lg font-sans text-h3 font-semibold text-ink">
              {agent.name}
            </h3>
            <p className="text-small font-medium text-accent">
              {agent.role}
            </p>
            <p className="mt-sm text-body leading-[1.65] text-ink-muted">
              {agent.desc}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
