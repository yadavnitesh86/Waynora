import { useEffect, useReducer, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import {
  initGame,
  moveGame,
} from "../../lib/game/2048/engine";
import type {
  Direction,
  GameState,
  Rng,
} from "../../lib/game/2048/types";
import Button from "../ui/Button";
import GameBoard from "./GameBoard";

const BEST_SCORE_KEY = "waynora:2048:best";
const SWIPE_THRESHOLD_PX = 24;

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  a: "LEFT",
  s: "DOWN",
  d: "RIGHT",
  W: "UP",
  A: "LEFT",
  S: "DOWN",
  D: "RIGHT",
};

/**
 * Best score is a convenience, never a crash: storage can throw in privacy
 * modes or be unavailable in some test/embedding contexts.
 */
function loadBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value: number): void {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(value));
  } catch {
    // Persistence is best-effort; the session game keeps working regardless.
  }
}

/** True when the user is typing; game keys must belong to the composer. */
function isTypingTarget(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  );
}

type Action = { type: "move"; direction: Direction } | { type: "new-game" };

export interface Game2048Props {
  /** Test seam: injectable RNG keeps spawns deterministic under test. */
  rng?: Rng;
  /** Test seam: start from a given state (win / game-over scenarios). */
  initialState?: GameState;
}

/**
 * The 2048 waiting-game controller (GAME-02…GAME-07). React state is a thin
 * reducer over the pure engine — every transition is `moveGame`/`initGame`,
 * so nothing here can drift from the deterministic rules (GAME-05).
 *
 * Input isolation (GAME-06):
 * - Keyboard play lives on the board container itself, so arrow keys only
 *   act while the board has focus; keystrokes are additionally ignored when
 *   any input/textarea/select is the active element.
 * - `preventDefault()` runs only for handled game keys on the board, so
 *   page scrolling and other shortcuts are untouched.
 * - The board uses `touch-action: none`; swipes are measured in
 *   touchstart/touchend and never scroll-jack the viewport.
 */
export default function Game2048({ rng = Math.random, initialState }: Game2048Props) {
  const rngRef = useRef<Rng>(rng);
  const [keepGoing, setKeepGoing] = useState(false);

  function reducer(current: GameState, action: Action): GameState {
    if (action.type === "move") {
      return moveGame(current, action.direction, rngRef.current);
    }
    return initGame(rngRef.current, current.bestScore);
  }

  function initState(arg: { state?: GameState; bestScore: number }): GameState {
    return arg.state ?? initGame(rngRef.current, arg.bestScore);
  }

  const [state, dispatch] = useReducer(
    reducer,
    { state: initialState, bestScore: loadBestScore() },
    initState,
  );

  useEffect(() => {
    saveBestScore(state.bestScore);
  }, [state.bestScore]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTypingTarget()) return;
    const direction = KEY_DIRECTIONS[event.key];
    if (direction === undefined) return;
    // Only handled game keys, only on the board, are consumed.
    event.preventDefault();
    dispatch({ type: "move", direction });
  }

  const swipeOrigin = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>): void {
    const touch = event.touches[0];
    swipeOrigin.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>): void {
    const origin = swipeOrigin.current;
    swipeOrigin.current = null;
    const touch = event.changedTouches[0];
    if (!origin || !touch) return;
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) {
      return;
    }
    const direction: Direction =
      Math.abs(dx) >= Math.abs(dy)
        ? dx > 0
          ? "RIGHT"
          : "LEFT"
        : dy > 0
          ? "DOWN"
          : "UP";
    dispatch({ type: "move", direction });
  }

  function newGame(): void {
    dispatch({ type: "new-game" });
    setKeepGoing(false);
  }

  const padButtons: Record<
    "up" | "left" | "down" | "right",
    { label: string; glyph: string; direction: Direction }
  > = {
    up: { label: "Move up", glyph: "↑", direction: "UP" },
    left: { label: "Move left", glyph: "←", direction: "LEFT" },
    down: { label: "Move down", glyph: "↓", direction: "DOWN" },
    right: { label: "Move right", glyph: "→", direction: "RIGHT" },
  };

  function PadButton({
    spec,
  }: {
    spec: { label: string; glyph: string; direction: Direction };
  }) {
    return (
      <Button
        variant="secondary"
        aria-label={spec.label}
        className="min-h-[56px] min-w-[56px] px-0 text-lead"
        onClick={() => dispatch({ type: "move", direction: spec.direction })}
      >
        <span aria-hidden="true">{spec.glyph}</span>
      </Button>
    );
  }

  return (
    <section aria-label="2048 game" className="w-full max-w-md">
      <div className="flex items-center justify-between gap-sm">
        <h4 className="font-display text-h3 text-ink">2048</h4>
        <Button variant="secondary" size="sm" onClick={newGame}>
          New Game
        </Button>
      </div>

      <div className="mt-xs grid grid-cols-2 gap-xs">
        <div className="rounded-md border border-line bg-surface px-sm py-xs">
          <p className="text-overline uppercase text-ink-muted">Current Score</p>
          <p className="font-mono text-body tabular-nums text-ink">
            {state.score}
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface px-sm py-xs">
          <p className="text-overline uppercase text-ink-muted">Best Score</p>
          <p className="font-mono text-body tabular-nums text-ink">
            {state.bestScore}
          </p>
        </div>
      </div>

      {/* Desktop keyboard hint */}
      <p className="mt-xs hidden text-small text-ink-muted sm:block">
        Use arrow keys or WASD to move tiles
      </p>
      {/* Mobile swipe / tap hint */}
      <p className="mt-xs text-small text-ink-muted sm:hidden">
        Swipe or tap arrows to move tiles
      </p>

      <GameBoard
        grid={state.grid}
        winVisible={state.won && !keepGoing}
        gameOver={state.gameOver}
        onKeepGoing={() => setKeepGoing(true)}
        onRestart={newGame}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="mt-sm"
      />

      {/* On-screen touch controls — thumb-sized targets, mobile viewports only.
          Classic plus layout: up on its own row, left/down/right beneath. */}
      <div
        role="group"
        aria-label="Touch direction controls"
        className="mt-sm grid max-w-[240px] grid-cols-3 justify-items-center gap-xs sm:hidden"
      >
        <span aria-hidden="true" />
        <PadButton spec={padButtons.up} />
        <span aria-hidden="true" />
        <PadButton spec={padButtons.left} />
        <PadButton spec={padButtons.down} />
        <PadButton spec={padButtons.right} />
      </div>

      {/* Polite score announcement for screen readers (GAME-07) */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Score: ${state.score}. Best score: ${state.bestScore}.`}
      </p>
    </section>
  );
}
