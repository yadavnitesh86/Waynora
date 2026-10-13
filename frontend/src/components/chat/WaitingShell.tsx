import { BAND_COPY, selectBand, selectVariant, formatElapsed } from "./waitingCopy";
import Spinner from "../ui/Spinner";
import Button from "../ui/Button";

export interface WaitingShellProps {
  elapsedMs: number;
  onStop: () => void;
}

/**
 * The composed waiting panel (WAIT-03, WAIT-04): heading, elapsed readout,
 * expectation line, live band copy, Stop waiting control, empty reserved game
 * slot. A pure function of elapsed for copy selection — no render-count path,
 * no progress/meter element, no specialist-agent names.
 */
export default function WaitingShell({ elapsedMs, onStop }: WaitingShellProps) {
  const band = selectBand(elapsedMs);
  const variant = selectVariant(elapsedMs);
  const copy = BAND_COPY[band][variant];
  const readout = formatElapsed(elapsedMs);

  return (
    <div className="w-full max-w-container-md rounded-lg border border-line bg-surface p-lg shadow-sm">
      {/* Spinner + heading row */}
      <div className="flex items-center gap-xs">
        <Spinner size="md" />
        <h3 className="font-sans text-h3 font-semibold text-ink">
          Waynora is planning your trip
        </h3>
      </div>

      {/* Elapsed readout + expectation line */}
      <div className="mt-md flex items-baseline gap-xs">
        <span className="text-small text-ink-muted">Elapsed</span>
        <span className="font-mono text-small tabular-nums text-ink">
          {readout}
        </span>
        <span className="text-small text-ink-muted">
          Plans usually take 5 to 15 minutes.
        </span>
      </div>

      {/* Band copy — the only live region in the shell */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-sm text-body text-ink"
      >
        {copy}
      </div>

      {/* Stop waiting control */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onStop}
        className="mt-md"
      >
        Stop waiting
      </Button>

      {/* Reserved game slot — Phase 3 renders NOTHING here (no element, no
          reserved height). Phase 4 mounts the 2048 board (GAME-01). */}
    </div>
  );
}
