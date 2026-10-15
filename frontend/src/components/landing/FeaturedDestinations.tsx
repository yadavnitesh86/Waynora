import { useState } from "react";
import { Link } from "react-router-dom";
import SectionWrapper from "./SectionWrapper";

interface Destination {
  id: string;
  title: string;
  region: string;
  duration: string;
  season: string;
  vibe: string;
  summary: string;
  stops: string[];
  prompt: string;
  badge: string;
  image: string;
}

const DESTINATIONS: Destination[] = [
  {
    id: "japan",
    title: "Kyoto & Kanazawa: Temples & Tea Gardens",
    region: "Honshu, Japan",
    duration: "10 Days",
    season: "April – May / Oct – Nov",
    vibe: "Cultural • High-Speed Rail • Kaiseki",
    summary:
      "A deliberate balance of imperial shrines, Zen rock gardens, morning Hokuriku Shinkansen journeys, and preserved Edo tea districts.",
    stops: ["Arashiyama Bamboo Grove", "Kinkaku-ji at Dawn", "Higashi Chaya District", "Kenroku-en Gardens"],
    prompt: "Plan a 10-day cultural journey to Kyoto and Kanazawa in autumn, focused on artisan districts, historic ryokans, and high-speed rail.",
    badge: "CURATED EXPEDITION",
    image: "/images/destinations/kyoto.jpg",
  },
  {
    id: "italy",
    title: "Amalfi Coast & Capri: Cliffside Havens",
    region: "Campania, Italy",
    duration: "8 Days",
    season: "May – June / Sept – Oct",
    vibe: "Tyrrhenian Sea • Ferries • Cliffside Villas",
    summary:
      "Sun-drenched terraces over the Gulf of Salerno, private skiff transfers to Capri coves, and sunset lemon grove walks in Ravello.",
    stops: ["Positano Spiaggia Grande", "Villa Cimbrone Gardens", "Capri Blue Grotto Skiff", "Path of the Gods Trail"],
    prompt: "Plan an 8-day scenic trip along the Amalfi Coast and Capri in June for two travelers, with boutique seaside hotels and ferry logistics.",
    badge: "COASTAL LUXURY",
    image: "/images/destinations/amalfi.jpg",
  },
  {
    id: "swiss",
    title: "Swiss Alpine Glacier Rail: St. Moritz to Zermatt",
    region: "Valais & Graubünden, Switzerland",
    duration: "7 Days",
    season: "Year-Round (Winter Snow / Summer Wildflowers)",
    vibe: "Panoramic Rail • Alpine Chalets • Fondue",
    summary:
      "Traverse 291 bridges and 91 tunnels aboard the Glacier Express, with fondue dinners beneath the Matterhorn and vintage funicular rides.",
    stops: ["Glacier Express Panoramic Car", "Matterhorn Glacier Paradise", "Oberalp Pass Summit", "Gornergrat Funicular"],
    prompt: "Plan a 7-day scenic rail journey across Switzerland from St. Moritz to Zermatt on the Glacier Express, mid-range luxury.",
    badge: "SCENIC PANORAMA",
    image: "/images/destinations/swiss-alps.jpg",
  },
  {
    id: "patagonia",
    title: "Patagonian Fjords: Torres del Paine Frontier",
    region: "Magallanes, Chile",
    duration: "9 Days",
    season: "November – March",
    vibe: "Glacial Lakes • Catamarans • Eco-Lodges",
    summary:
      "Granite towers rising above turquoise glacial lakes, private catamaran crossings to Grey Glacier, and luxury eco-domes under southern skies.",
    stops: ["French Valley Trek", "Grey Glacier Catamaran", "Mirador Las Torres", "Pehoé Lake Lookout"],
    prompt: "Plan a 9-day adventure to Torres del Paine in Patagonia with comfortable lodge stays, guided day hikes, and private transfers.",
    badge: "WILD FRONTIER",
    image: "/images/destinations/patagonia.jpg",
  },
];

export default function FeaturedDestinations() {
  const defaultDest = DESTINATIONS[0] as Destination;
  const [selectedDest, setSelectedDest] = useState<string>(defaultDest.id);
  const active: Destination = DESTINATIONS.find((d) => d.id === selectedDest) ?? defaultDest;

  return (
    <SectionWrapper id="curated-journeys" ariaLabelledBy="curated-journeys-title">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md mb-2xl">
        <div className="max-w-[48rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3 py-1 mb-xs shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
              Inspiring Itineraries
            </p>
          </div>
          <h2
            id="curated-journeys-title"
            className="mt-xs font-display text-h2 font-semibold text-ink tracking-tight"
          >
            Curated journeys, ready for custom synthesis.
          </h2>
          <p className="mt-sm text-lead text-ink-muted leading-[1.65]">
            Explore handcrafted route archetypes. Choose any journey and instruct Waynora&apos;s
            agents to tailor every detail to your dates, budget, and party.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-xs p-1 rounded-full bg-surface border border-line/70 shadow-2xs">
          {DESTINATIONS.map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => setSelectedDest(dest.id)}
              className={[
                "px-sm py-1.5 text-caption font-medium rounded-full transition-all duration-200",
                selectedDest === dest.id
                  ? "bg-accent text-accent-ink font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised",
              ].join(" ")}
            >
              {dest.title.split(":")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Heroic Featured Showcase Card */}
      <div className="rounded-2xl border border-line/80 bg-surface p-xl lg:p-2xl shadow-luxury transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
          {/* Details Column */}
          <div className="lg:col-span-7 space-y-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gold/40 bg-gold-soft px-3 py-0.5 font-mono text-[10px] font-semibold text-gold-muted uppercase tracking-wider">
                {active.badge}
              </span>
              <span className="text-[11px] font-mono font-semibold text-accent uppercase">
                {active.region}
              </span>
            </div>

            <h3 className="font-display text-h1 font-semibold text-ink tracking-tight leading-tight">
              {active.title}
            </h3>

            <p className="text-body text-ink-muted leading-[1.7] max-w-prose">
              {active.summary}
            </p>

            {/* Metric pill bar */}
            <div className="grid grid-cols-3 gap-sm py-md border-y border-line/60">
              <div>
                <p className="text-[10px] font-mono uppercase text-ink-muted">DURATION</p>
                <p className="text-small font-semibold text-ink mt-0.5">{active.duration}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-ink-muted">BEST WINDOW</p>
                <p className="text-small font-semibold text-ink mt-0.5">{active.season}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-ink-muted">PACE & VIBE</p>
                <p className="text-small font-semibold text-accent mt-0.5">{active.vibe.split("•")[0]}</p>
              </div>
            </div>

            {/* Highlights List */}
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase text-ink-muted/80 tracking-wider mb-2">
                VERIFIED WAYPOINTS:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-caption text-ink-muted">
                {active.stops.map((stop) => (
                  <div key={stop} className="flex items-center gap-2">
                    <span className="text-gold text-[11px]">✦</span>
                    <span className="text-ink font-medium">{stop}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-md flex items-center gap-md">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-accent px-6 py-3 text-small font-semibold text-accent-ink shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-gold"
              >
                <span>Instruct Agent to Plan This</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-ink/20 text-[11px] transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <span className="text-caption text-ink-muted font-mono">
                Ready to customize in chat
              </span>
            </div>
          </div>

          {/* Right Visual Ambient Specimen with Real Travel Photo */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-line/80 bg-surface overflow-hidden shadow-luxury group transition-all">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-dark">
                <img
                  src={active.image}
                  alt={active.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/85 via-surface-dark/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-ink-inverse">
                  <span className="font-display text-small font-semibold">
                    {active.title.split(":")[0]}
                  </span>
                  <span className="rounded-full bg-surface-dark/70 px-2.5 py-0.5 font-mono text-[10px] text-gold uppercase border border-gold/30 backdrop-blur-xs">
                    {active.duration}
                  </span>
                </div>
              </div>

              {/* Specification preview */}
              <div className="p-md bg-surface">
                <div className="flex items-center justify-between border-b border-line/60 pb-xs mb-xs">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle" />
                    AUTONOMOUS ROUTE SPEC
                  </span>
                  <span className="font-mono text-[10px] text-gold-muted font-bold">5–15 MIN SYNTHESIS</span>
                </div>
                <p className="text-caption text-ink-muted italic font-display leading-snug">
                  &ldquo;{active.prompt}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
