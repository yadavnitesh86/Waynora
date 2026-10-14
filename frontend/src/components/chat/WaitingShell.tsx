import { BAND_COPY, selectBand, selectVariant, formatElapsed } from "./waitingCopy";
import Spinner from "../ui/Spinner";
import Button from "../ui/Button";
import Game2048 from "../game/Game2048";

export interface WaitingShellProps {
  elapsedMs: number;
  onStop: () => void;
  /**
   * GAME-01: the 2048 board mounts only while the request is ACTIVELY
   * waiting. The brief submitting phase renders this shell without the
   * game, and the terminal phases unmount the whole shell — the board
   * can never outlive the waiting status.
   */
  isWaiting?: boolean;
}

/**
 * The composed waiting panel (WAIT-03, WAIT-04): heading, elapsed readout,
 * expectation line, live band copy, Stop waiting control, and — while the
 * request is actively waiting (GAME-01) — a "Waiting lounge" card holding
 * the 2048 board. A pure function of elapsed for copy selection — no
 * render-count path, no progress/meter element, no specialist-agent names.
 *
 * The game is decoration during a real wait: it receives no request state,
 * calls no chat callbacks, and the stop control wires straight to the
 * controller's abort (GAME-06 — playing never touches the in-flight
 * request). Side-by-side from `lg` up so the wide desktop layout keeps the
 * honest timing copy visible next to the board; stacked on smaller screens.
 */
export default function WaitingShell({
  elapsedMs,
  onStop,
  isWaiting = false,
}: WaitingShellProps) {
  const band = selectBand(elapsedMs);
  const variant = selectVariant(elapsedMs);
  const copy = BAND_COPY[band][variant];
  const readout = formatElapsed(elapsedMs);

  return (
    <div className="w-full max-w-container-md rounded-lg border border-line bg-surface p-lg shadow-sm">
      <div className="grid gap-lg lg:grid-cols-2 lg:items-start">
        <div>
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
        </div>

        {/* Waiting lounge — the 2048 board, only while actively waiting
            (GAME-01). Honest decoration: no progress implication, no link
            to the request beyond sharing the waiting phase. */}
        {isWaiting ? (
          <div className="rounded-md border border-line bg-canvas p-sm">
            <h4 className="font-sans text-small font-semibold text-ink">
              Waiting lounge
            </h4>
            <p className="mt-2xs text-caption text-ink-muted">
              A game of 2048 to pass the time. Playing never affects your
              request.
            </p>
            <Game2048 />
          </div>
        ) : null}
      </div>
    </div>
  );
}
