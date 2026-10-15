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
    <div className="mt-2 rounded-xl border border-gold/30 bg-surface/95 px-3 py-2 shadow-xs backdrop-blur-md">
      <h3 className="sr-only">Waynora is planning your trip</h3>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Running time & expectation */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-5 w-5 shrink-0 items-center justify-center text-accent">
            <Spinner size="sm" />
          </div>

          <div className="flex items-baseline gap-1.5 font-mono text-[13px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-muted">
              Elapsed
            </span>
            <span className="font-mono text-body font-bold tabular-nums text-accent px-1.5 py-0.5 rounded bg-accent-soft/70">
              {readout}
            </span>
          </div>

          <span className="text-line/80">•</span>

          <span className="text-caption text-ink-muted font-medium">
            Plans usually take 5 to 15 minutes.
          </span>
        </div>

        {/* Stop control & live copy */}
        <div className="flex items-center gap-2">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="text-caption text-ink-muted/80 italic max-w-[180px] truncate"
          >
            {copy}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onStop}
            className="h-7 rounded-full px-2.5 text-[11px] text-ink-muted hover:border-danger hover:text-danger hover:bg-danger/5 transition-all"
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
 */
export function WaitingLounge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-line/80 bg-surface/95 p-sm sm:p-md shadow-card backdrop-blur-md ${className}`}
    >
      <h4 className="font-display text-small font-semibold text-ink tracking-tight">
        Waiting lounge
      </h4>
      <p className="mt-2xs text-caption text-ink-muted leading-relaxed mb-sm">
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
 */
export default function WaitingShell({
  elapsedMs,
  onStop,
  isWaiting = false,
}: WaitingShellProps) {
  return (
    <div className="w-full transition-all">
      <div className="grid gap-lg lg:grid-cols-[1fr_360px] lg:items-start w-full">
        <div className="flex flex-col min-w-0">
          <WaitingTimer elapsedMs={elapsedMs} onStop={onStop} />
        </div>
        {isWaiting ? <WaitingLounge /> : null}
      </div>
    </div>
  );
}
