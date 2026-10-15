import SectionWrapper from "./SectionWrapper";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Describe your trip",
      desc: "Tell Waynora where you want to go, for how long, and any preferences. A single sentence or detailed requirements work equally well.",
    },
    {
      num: "02",
      title: "Agents get to work",
      desc: "A Destination Planner, Transport Agent, and AccommodationWeather Agent research your trip simultaneously using live specialized queries.",
    },
    {
      num: "03",
      title: "Your plan is assembled",
      desc: "The main travel agent synthesises all agent research into a single, cohesive, readable itinerary with daily itineraries and transit details.",
    },
    {
      num: "04",
      title: "Read it, then plan the real thing",
      desc: "An honest planning starting point — no booking, no live pricing, no hallucinations. Take the plan and book your real tickets with confidence.",
    },
  ];

  return (
    <SectionWrapper id="how-it-works" ariaLabelledBy="how-it-works-title">
      <div className="max-w-[48rem]">
        <p className="text-overline font-semibold uppercase tracking-[0.14em] text-accent">
          The planning process
        </p>
        <h2
          id="how-it-works-title"
          className="mt-xs font-display text-h2 font-semibold text-ink"
        >
          From idea to itinerary
        </h2>
        <p className="mt-sm text-lead text-ink-muted">
          Waynora breaks complex travel planning into deliberate specialist tasks rather than
          generating generic, hallucinated lists in two seconds.
        </p>
      </div>

      <div className="mt-2xl grid grid-cols-1 gap-lg md:grid-cols-2 lg:gap-xl">
        {steps.map((step) => (
          <div
            key={step.num}
            className="flex flex-col gap-sm rounded-lg border border-line bg-surface p-xl shadow-xs transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-h2 font-bold text-accent/80">
                {step.num}
              </span>
              <span className="h-1.5 w-8 rounded-full bg-line" />
            </div>
            <h3 className="font-sans text-h3 font-semibold text-ink">
              {step.title}
            </h3>
            <p className="text-body leading-[1.65] text-ink-muted">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
