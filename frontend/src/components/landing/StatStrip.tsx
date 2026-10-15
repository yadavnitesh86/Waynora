export default function StatStrip() {
  const stats = [
    {
      value: "5 – 15 min",
      label: "Average planning time",
      detail: "Deep multi-agent search and synthesis takes time.",
      tag: "SYNCHRONOUS RESEARCH",
    },
    {
      value: "3",
      label: "Specialist agents at work",
      detail: "Destination, transport, and accommodation specialists.",
      tag: "COORDINATED ATELIERS",
    },
    {
      value: "Real",
      label: "No fake progress or hallucinated plans",
      detail: "Every itinerary step is verified before compilation.",
      tag: "HONEST TRUTH",
    },
  ];

  return (
    <section
      aria-label="Planning metrics"
      className="border-y border-gold/25 bg-surface-dark py-2xl text-ink-inverse relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute left-1/3 top-0 h-full w-96 bg-accent/20 blur-3xl" />
        <div className="absolute right-10 bottom-0 h-full w-72 bg-gold/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-container-xl px-md relative z-10">
        <div className="grid grid-cols-1 gap-xl sm:grid-cols-3 sm:gap-lg divide-y divide-line/15 sm:divide-y-0 sm:divide-x sm:divide-line/15">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-sm ${idx > 0 ? "pt-lg sm:pt-0 sm:pl-xl" : "sm:pr-xl"}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gold text-[10px]">✦</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-gold/90 font-semibold">
                  {stat.tag}
                </span>
              </div>
              <p className="font-display text-display font-semibold tracking-tight text-ink-inverse sm:text-[3.25rem] leading-none">
                {stat.value}
              </p>
              <p className="text-body font-semibold text-ink-inverse tracking-tight">
                {stat.label}
              </p>
              <p className="text-caption text-ink-inverse-muted leading-relaxed max-w-[34ch]">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
