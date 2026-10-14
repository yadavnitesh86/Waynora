import type { KeyboardEvent, TouchEvent } from "react";
import type { Grid } from "../../lib/game/2048/types";
import Button from "../ui/Button";
import Tile from "./Tile";

export interface GameBoardProps {
  grid: Grid;
  /** Show the win overlay: reached 2048 and not yet dismissed via Keep Going. */
  winVisible: boolean;
  gameOver: boolean;
  onKeepGoing: () => void;
  onRestart: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onTouchStart?: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (event: TouchEvent<HTMLDivElement>) => void;
  className?: string;
}

function cellLabel(tile: { value: number } | null): string {
  return tile === null ? "Empty" : `Tile ${tile.value}`;
}

/**
 * The 4x4 2048 board (GAME-04, GAME-07): an ARIA grid of rows and cells
 * that is focusable for keyboard play, `touch-action: none` so swipes never
 * scroll-jack the page (GAME-06), and role="status" outcome overlays with
 * restart controls (GAME-03). Purely presentational — all state transitions
 * and input wiring live in the parent controller.
 */
export default function GameBoard({
  grid,
  winVisible,
  gameOver,
  onKeepGoing,
  onRestart,
  onKeyDown,
  onTouchStart,
  onTouchEnd,
  className,
}: GameBoardProps) {
  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <div
        role="grid"
        aria-label="2048 game board"
        tabIndex={0}
        // touch-action: none stops the browser turning swipes into page
        // scrolls while play is live on the board (GAME-06).
        className="touch-none select-none rounded-lg border border-line bg-surface p-xs shadow-sm"
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {grid.map((row, rowIndex) => (
          <div
            // ARIA grid rows are structural; index keys are stable here.
            key={`row-${rowIndex}`}
            role="row"
            className="grid grid-cols-4 gap-xs"
          >
            {row.map((tile, colIndex) => (
              <div
                key={`cell-${colIndex}`}
                role="gridcell"
                aria-label={cellLabel(tile)}
                className="aspect-square rounded-md bg-canvas"
              >
                {tile !== null ? <Tile tile={tile} /> : null}
              </div>
            ))}
          </div>
        ))}
      </div>

      {winVisible ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-canvas">
          <div
            role="status"
            className="mx-md flex flex-col items-center gap-sm rounded-lg border border-line bg-surface px-lg py-lg text-center shadow-lg"
          >
            <h3 className="font-display text-h3 text-ink">You win!</h3>
            <p className="text-small text-ink-muted">
              You reached 2048. Keep going for a higher score, or start over.
            </p>
            <div className="flex flex-wrap justify-center gap-xs">
              <Button variant="primary" size="sm" onClick={onKeepGoing}>
                Keep Going
              </Button>
              <Button variant="secondary" size="sm" onClick={onRestart}>
                New Game
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {gameOver ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-canvas">
          <div
            role="status"
            className="mx-md flex flex-col items-center gap-sm rounded-lg border border-line bg-surface px-lg py-lg text-center shadow-lg"
          >
            <h3 className="font-display text-h3 text-ink">Game Over</h3>
            <p className="text-small text-ink-muted">
              No moves left on this board.
            </p>
            <Button variant="primary" size="sm" onClick={onRestart}>
              Try Again
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
