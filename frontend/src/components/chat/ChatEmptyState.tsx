export interface ChatEmptyStateProps {
  /** Drops a ready-made brief into the composer and focuses it. */
  onPickPrompt: (text: string) => void;
  className?: string;
}

/**
 * Starting points offered under the empty state.
 *
 * They are real, plain-language briefs of the kind the planner expects —
 * no invented destinations, no fake pricing, no capability claims. Clicking
 * one fills the composer rather than firing a request, so the user still
 * reviews and edits before anything is sent.
 */
const STARTER_PROMPTS = [
  "10 days in Japan in April, cherry blossom season",
  "2 weeks in Northern Italy, Rome down to the Amalfi coast",
  "Swiss Alps by rail, with boutique alpine stays",
  "10 days in Portugal, Lisbon, Porto and the Douro",
];

/** Compass emblem — the one place gold carries meaning on this surface. */
function CompassGlyph() {
  return (
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
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

/** Sparkle that marks a starting point. Decorative, hidden from readers. */
function SparkGlyph() {
  return (
    <span aria-hidden="true" className="text-gold transition-colors">
      ✦
    </span>
  );
}

/**
 * The chat column's first-run surface (C-16, C-17).
 *
 * A chat-local replacement for the shared `EmptyState`, for two reasons:
 * the generic one ships a capability claim ("3 specialists standing by")
 * that this project is not allowed to make, and it renders idea pills as
 * inert `<span>`s with hover styling — an affordance that promises a click
 * and does nothing.
 *
 * Copy for the heading and the body is verbatim from the UI spec; nothing
 * here claims how the plan is built, only what the user should do next.
 */
export default function ChatEmptyState({
  onPickPrompt,
  className,
}: ChatEmptyStateProps) {
  return (
    <div
      className={[
        "max-w-2xl rounded-[1.75rem] border border-gold/25 bg-surface/70 p-1.5 shadow-luxury",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="rounded-[calc(1.75rem-0.375rem)] border border-line/80 bg-surface-raised p-xl md:p-2xl">
        <div className="mb-lg flex items-center gap-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-accent-soft text-accent shadow-2xs">
            <CompassGlyph />
          </div>
          <div className="min-w-0">
            <p className="font-display text-small font-semibold tracking-tight text-ink">
              Waynora
            </p>
            <p className="text-caption text-ink-muted">
              Describe a trip, get a plan back
            </p>
          </div>
        </div>

        <h2 className="font-display text-h2 font-semibold tracking-tight text-ink text-balance">
          Where do you want to go?
        </h2>
        <p className="mt-sm max-w-prose text-lead leading-[1.6] text-ink-muted">
          Describe your trip in your own words. A real agent builds the plan,
          usually in 15 to 20 minutes. Your chat stays in this browser.
        </p>

        <div className="mt-xl border-t border-line/60 pt-lg">
          <p className="mb-sm text-overline font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Or start from an idea
          </p>
          <div className="flex flex-wrap gap-xs">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPickPrompt(prompt)}
                className="group inline-flex items-center gap-xs rounded-full border border-line bg-canvas/70 px-md py-sm text-caption text-ink-muted transition-all duration-200 ease-out hover:-translate-y-px hover:border-gold/60 hover:text-ink hover:shadow-sm focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 active:translate-y-0"
              >
                <SparkGlyph />
                <span className="text-left">{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
