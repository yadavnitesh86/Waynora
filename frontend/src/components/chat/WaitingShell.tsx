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
 * Atmospheric waiting shell (WAIT-03, WAIT-04, 05-UI-SPEC Surface 8).
 *
 * Double-bezel card structure, pulsing dots indicator, prominent tabular
 * mono elapsed clock, blockquote band copy with display serif styling,
 * and an isolated 2048 waiting lounge.
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
    <div className="w-full max-w-container-md rounded-[1.25rem] border border-line bg-surface p-1.5 shadow-sm">
      <div className="rounded-xl border border-line/70 bg-surface-raised/60 p-md sm:p-lg">
        <div className="grid gap-lg lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col">
            {/* Active status row with Spinner + 3 pulsing dots */}
            <div className="flex items-center gap-sm">
              <Spinner size="md" />
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse-subtle" />
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse-subtle [animation-delay:200ms]" />
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse-subtle [animation-delay:400ms]" />
              </div>
              <h3 className="font-display text-h3 font-semibold text-ink tracking-tight">
                Waynora is planning your trip
              </h3>
            </div>

            {/* Elapsed readout + honest expectation line */}
            <div className="mt-md rounded-md bg-canvas/80 border border-line/60 px-md py-sm flex flex-wrap items-baseline gap-xs">
              <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted">Elapsed</span>
              <span className="font-mono text-body font-semibold tabular-nums text-accent">
                {readout}
              </span>
              <span className="text-caption text-ink-muted ml-auto">
                Plans usually take 5 to 15 minutes.
              </span>
            </div>

            {/* Live band copy pull-quote — the only live region in the shell */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="mt-md border-l-2 border-accent/60 pl-md py-1 font-display italic text-lead text-ink/90 leading-snug"
            >
              {copy}
            </div>

            {/* Stop waiting control */}
            <div className="mt-lg">
              <Button
                variant="secondary"
                size="sm"
                onClick={onStop}
                className="hover:border-danger hover:text-danger transition-colors"
              >
                Stop waiting
              </Button>
            </div>
          </div>

          {/* Waiting lounge — 2048 game during active wait */}
          {isWaiting ? (
            <div className="rounded-lg border border-line bg-canvas p-xs sm:p-sm">
              <h4 className="font-display text-small font-semibold text-ink">
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
    </div>
  );
}
