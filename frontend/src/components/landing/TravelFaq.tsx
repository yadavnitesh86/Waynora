import { useState } from "react";
import SectionWrapper from "./SectionWrapper";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    id: "hallucination",
    category: "RESEARCH QUALITY",
    question: "How does Waynora differ from standard AI chatbots?",
    answer:
      "Generalist chatbots attempt to write an entire trip in two seconds from training memory, producing phantom train lines, closed museums, and physically impossible daily schedules. Waynora deploys three dedicated specialists — Destination, Transport, and Accommodation/Weather — that cross-verify every transit window and opening hour before returning a final itinerary.",
  },
  {
    id: "timing",
    category: "HONEST SYNTHESIS",
    question: "Why does planning take 5 to 15 minutes?",
    answer:
      "Deep autonomous research requires real computation. Our agents calculate multi-city transit legs, verify neighborhood walkability, and consider microclimates across your travel window. We do not display fake loading progress or spit out pre-cached tourist lists.",
  },
  {
    id: "privacy",
    category: "DATA & PRIVACY",
    question: "Where are my trip requests and chat history saved?",
    answer:
      "Your chats, itineraries, and trip notes are stored directly in your browser's local cookie session. We do not sell your travel preferences to third-party ad networks or deluge you with sponsored affiliate spam.",
  },
  {
    id: "customization",
    category: "PERSONALIZATION",
    question: "Can I specify specialized budgets, children, or mobility requirements?",
    answer:
      "Yes. Speak to Waynora as you would to an experienced private concierge. Mention dietary needs, pacing preferences ('slow travel, maximum one museum per day'), traveling with toddlers, or specific rail pass preferences, and all three agents will adapt their synthesis accordingly.",
  },
];

export default function TravelFaq() {
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);

  function toggleFaq(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <SectionWrapper id="faq" ariaLabelledBy="faq-title">
      <div className="max-w-[48rem]">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3 py-1 mb-xs shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
            Travel Concierge Questions
          </p>
        </div>
        <h2
          id="faq-title"
          className="mt-xs font-display text-h2 font-semibold text-ink tracking-tight"
        >
          Frequently asked concierge questions.
        </h2>
        <p className="mt-sm text-lead text-ink-muted leading-[1.65]">
          Clear answers about how our multi-agent architecture operates, why we take time to build
          authentic plans, and how your privacy is preserved.
        </p>
      </div>

      <div className="mt-2xl space-y-md max-w-container-md">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-2xl border border-line/80 bg-surface overflow-hidden transition-all duration-200 shadow-sm hover:border-gold/50"
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-lg text-left transition-colors"
              >
                <div className="space-y-1 pr-md">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gold-muted font-bold block">
                    {faq.category}
                  </span>
                  <span className="font-sans text-lead font-semibold text-ink">
                    {faq.question}
                  </span>
                </div>
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised font-mono text-small transition-transform duration-200",
                    isOpen ? "rotate-45 bg-accent text-accent-ink border-accent" : "text-ink-muted",
                  ].join(" ")}
                >
                  +
                </div>
              </button>

              {isOpen ? (
                <div className="px-lg pb-lg pt-xs border-t border-line/50 text-body text-ink-muted leading-[1.7]">
                  <p>{faq.answer}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
