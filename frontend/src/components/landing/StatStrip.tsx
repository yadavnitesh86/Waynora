export default function StatStrip() {
  const stats = [
    {
      value: "5 – 15 min",
      label: "Average planning time",
      detail: "Deep multi-agent search and synthesis takes time.",
    },
    {
      value: "3",
      label: "Specialist agents at work",
      detail: "Destination, transport, and accommodation specialists.",
    },
    {
      value: "Real",
      label: "No fake progress or hallucinated plans",
      detail: "Every itinerary step is verified before compilation.",
    },
  ];

  return (
    <section
      aria-label="Planning metrics"
      className="border-y border-line/20 bg-surface-dark py-xl text-ink-inverse"
    >
      <div className="mx-auto w-full max-w-container-xl px-md">
        <div className="grid grid-cols-1 gap-xl sm:grid-cols-3 sm:gap-lg divide-y divide-line/10 sm:divide-y-0 sm:divide-x sm:divide-line/10">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-xs ${idx > 0 ? "pt-lg sm:pt-0 sm:pl-lg" : ""}`}
            >
              <p className="font-display text-h1 font-bold tracking-tight text-ink-inverse">
                {stat.value}
              </p>
              <p className="text-small font-semibold text-ink-inverse">
                {stat.label}
              </p>
              <p className="text-caption text-ink-inverse-muted leading-relaxed">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
