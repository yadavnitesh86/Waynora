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
 * Compact waiting timer strip (Points 4, 5, 6).
 *
 * Shows running elapsed time and honest timing expectation, with stop button.
 * Unnecessary information (specialists, bulky quotes) removed.
 *
 * Everything here sits on the app's type scale: the strip is small, but not
 * by inventing 9px/11px sizes that fall off the scale and under AA contrast.
 * The live band copy is allowed to wrap — a sentence cut mid-word by
 * `truncate` is worse than a second line.
 */
export function WaitingTimer({
  elapsedMs,
  onStop,
}: {
  elapsedMs: number;
  onStop: () => void;
}) {
  const band = selectBand(elapsedMs);
  const variant = selectVariant(elapsedMs);
  const copy = BAND_COPY[band][variant];
  const readout = formatElapsed(elapsedMs);

  return (
    <div className="rounded-xl border border-line bg-surface/95 px-md py-sm shadow-sm">
      <h3 className="sr-only">Waynora is planning your trip</h3>

      <div className="flex flex-col gap-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-md">
        {/* Running time & expectation */}
        <div className="flex flex-wrap items-center gap-sm">
          <Spinner size="sm" />

          <div className="flex items-baseline gap-2xs">
            <span className="font-mono text-overline font-bold uppercase tracking-[0.14em] text-ink-muted">
              Elapsed
            </span>
            <span className="font-mono text-small font-bold tabular-nums text-accent">
              {readout}
            </span>
          </div>

          <span
            aria-hidden="true"
            className="hidden h-1 w-1 rounded-full bg-line sm:block"
          />

          <span className="text-caption text-ink-muted">
            Plans usually take 5 to 15 minutes.
          </span>
        </div>

        {/* Live copy & stop control */}
        <div className="flex flex-wrap items-center gap-sm sm:justify-end">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="max-w-[30ch] text-caption leading-snug text-ink-muted"
          >
            {copy}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onStop}
            className="rounded-full px-sm transition-colors hover:border-danger hover:bg-danger/5 hover:text-danger"
          >
            Stop waiting
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 2048 game lounge component in the right-side companion slot (Points 2 & 3).
 *
 * Quiet frame, no gold: while a plan is being built, the lounge should read
 * as a calm holding pattern, not as a third competing accent object.
 */
export function WaitingLounge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface/95 p-md shadow-sm ${className}`}
    >
      <h4 className="font-display text-small font-semibold tracking-tight text-ink">
        Waiting lounge
      </h4>
      <p className="mt-2xs mb-sm text-caption leading-relaxed text-ink-muted">
        A game of 2048 to pass the time. Playing never affects your request.
      </p>
      <Game2048 />
    </div>
  );
}

/**
 * Streamlined waiting shell & companion game lounge (WAIT-03, WAIT-04, GAME-01).
 *
 * Left column: Streamlined waiting status & running chronograph.
 * Right column: 2048 expedition lounge in the dedicated companion space.
 *
 * The companion grid only splits from `xl`: below that the board would take
 * a fixed 360px out of a chat column that is already narrowed by the history
 * panel, leaving the itinerary no room to be read.
 */
export default function WaitingShell({
  elapsedMs,
  onStop,
  isWaiting = false,
}: WaitingShellProps) {
  return (
    <div className="w-full transition-all">
      <div className="grid w-full gap-lg xl:grid-cols-[1fr_320px] xl:items-start">
        <div className="flex min-w-0 flex-col">
          <WaitingTimer elapsedMs={elapsedMs} onStop={onStop} />
        </div>
        {isWaiting ? <WaitingLounge /> : null}
      </div>
    </div>
  );
}
