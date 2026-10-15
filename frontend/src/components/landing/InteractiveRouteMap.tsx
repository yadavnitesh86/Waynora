import { useState } from "react";
import SectionWrapper from "./SectionWrapper";

interface Waypoint {
  id: number;
  name: string;
  type: "Air" | "Rail" | "Haven" | "Walking" | "Sea";
  time: string;
  distance: string;
  description: string;
  specialistNote: string;
}

const ROUTE_DATA: Waypoint[] = [
  {
    id: 1,
    name: "Tokyo International (HND)",
    type: "Air",
    time: "Day 1 • 09:30",
    distance: "Point of Arrival",
    description: "Private express transfer into Ginza/Marunouchi terminal.",
    specialistNote: "Transport Agent validated 45-min non-stop Keikyu / Monorail connection.",
  },
  {
    id: 2,
    name: "Hokuriku Shinkansen (Kagayaki)",
    type: "Rail",
    time: "Day 3 • 10:33",
    distance: "454 km • 2h 28m",
    description: "High-speed 260 km/h bullet rail through Nagano Alps into Kanazawa.",
    specialistNote: "Reserved seating car 7 selected for luggage rack clearance and Mount Asama views.",
  },
  {
    id: 3,
    name: "Higashi Chaya Artisan Haven",
    type: "Haven",
    time: "Day 4 • 14:00",
    distance: "Edo Tea Quarter",
    description: "Preserved 1820s timber machiya lodging with cedar bath and private garden.",
    specialistNote: "Accommodation Agent verified quiet residential zoning away from tour buses.",
  },
  {
    id: 4,
    name: "Thunderbird Express to Kyoto",
    type: "Rail",
    time: "Day 6 • 11:24",
    distance: "212 km • 2h 08m",
    description: "Scenic lakeside transit skirting Lake Biwa into Kyoto Station.",
    specialistNote: "Destination Planner synchronized arrival with Gion evening lantern illumination.",
  },
  {
    id: 5,
    name: "Arashiyama Bamboo Corridor",
    type: "Walking",
    time: "Day 8 • 07:15",
    distance: "4.2 km Walking Circuit",
    description: "Early morning private garden circuit before tourist influx, Tenryu-ji temple.",
    specialistNote: "Weather Agent confirms crisp 16°C morning; optimal photography lighting.",
  },
];

export default function InteractiveRouteMap() {
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint>(ROUTE_DATA[1] as Waypoint);

  return (
    <SectionWrapper id="interactive-route" ariaLabelledBy="interactive-route-title">
      <div className="max-w-[48rem]">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3 py-1 mb-xs shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
            Interactive Transit Topology
          </p>
        </div>
        <h2
          id="interactive-route-title"
          className="mt-xs font-display text-h2 font-semibold text-ink tracking-tight"
        >
          Realistic logistics stitched without dead ends.
        </h2>
        <p className="mt-sm text-lead text-ink-muted leading-[1.65]">
          A common failure of AI travel tools is proposing impossible transit legs. Waynora calculates
          verified timetables, train booking windows, and pedestrian walking radii for every stop.
        </p>
      </div>

      {/* Interactive 3D Route Display */}
      <div className="mt-2xl rounded-2xl border border-line/80 bg-surface p-xl sm:p-2xl shadow-luxury">
        {/* Interactive Waypoint Stepper Track */}
        <div className="relative mb-xl pb-md">
          {/* Connecting gradient line */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-gradient-to-r from-accent via-gold to-accent opacity-30 hidden md:block" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-md relative z-10">
            {ROUTE_DATA.map((wp) => {
              const isCurrent = activeWaypoint.id === wp.id;
              return (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setActiveWaypoint(wp)}
                  className={[
                    "flex flex-col items-start p-sm rounded-xl text-left transition-all duration-200",
                    isCurrent
                      ? "bg-accent-soft/80 border border-gold/40 shadow-xs"
                      : "hover:bg-surface-raised border border-transparent hover:border-line/60",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-mono font-bold transition-all",
                        isCurrent
                          ? "bg-accent text-accent-ink ring-2 ring-gold/50 shadow-xs"
                          : "bg-surface-raised border border-line text-ink-muted",
                      ].join(" ")}
                    >
                      {wp.id}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gold-muted font-semibold">
                      {wp.type}
                    </span>
                  </div>
                  <span className="font-display text-small font-semibold text-ink leading-snug truncate w-full">
                    {wp.name}
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted mt-0.5">
                    {wp.time.split("•")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Inspection Showcase */}
        <div className="rounded-xl border border-line/70 bg-canvas/70 p-lg sm:p-xl transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-line/60 pb-md mb-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gold text-[12px]">✦</span>
                <span className="font-mono text-caption text-ink-muted uppercase tracking-wider">
                  WAYPOINT {activeWaypoint.id} OF {ROUTE_DATA.length} • {activeWaypoint.type} LEG
                </span>
              </div>
              <h3 className="font-display text-h2 font-semibold text-ink tracking-tight mt-1">
                {activeWaypoint.name}
              </h3>
            </div>

            <div className="flex items-center gap-md font-mono text-caption">
              <div className="px-sm py-1 rounded bg-surface border border-line/80">
                <span className="text-ink-muted">SCHEDULE: </span>
                <span className="text-ink font-semibold">{activeWaypoint.time}</span>
              </div>
              <div className="px-sm py-1 rounded bg-surface border border-line/80">
                <span className="text-ink-muted">DISTANCE: </span>
                <span className="text-accent font-semibold">{activeWaypoint.distance}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg items-start">
            <div className="md:col-span-7">
              <p className="text-body text-ink leading-relaxed font-normal">
                {activeWaypoint.description}
              </p>
            </div>

            <div className="md:col-span-5 rounded-lg border border-gold/30 bg-gold-soft/60 p-md">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-gold-muted font-bold mb-1">
                <span>✦</span>
                <span>Specialist Synthesis Note</span>
              </div>
              <p className="text-caption text-ink leading-relaxed">
                {activeWaypoint.specialistNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
