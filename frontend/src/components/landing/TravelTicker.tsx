export default function TravelTicker() {
  const alerts = [
    { loc: "Kyoto", note: "Autumn foliage peak anticipated early November • Shinkansen running on normal schedule" },
    { loc: "Swiss Alps", note: "Glacier Express winter panoramic car reservations now open" },
    { loc: "Amalfi Coast", note: "Ferry schedules between Positano & Capri operating on summer charter frequency" },
    { loc: "Patagonia", note: "Torres del Paine trekking season opened with optimal visibility" },
  ];

  return (
    <div
      aria-label="Live travel intelligence"
      className="border-y border-line/60 bg-surface/90 backdrop-blur-xs py-2 overflow-hidden"
    >
      <div className="mx-auto w-full max-w-container-xl px-md flex items-center gap-md">
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-accent">
            LIVE ATELIER INTEL
          </span>
        </div>

        <div className="flex items-center gap-xl overflow-x-auto no-scrollbar py-0.5 text-caption font-mono text-ink-muted">
          {alerts.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <span className="text-gold">✦</span>
              <span className="text-ink font-semibold">{item.loc}:</span>
              <span>{item.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
