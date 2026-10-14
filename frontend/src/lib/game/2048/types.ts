/**
 * Core types for the deterministic 2048 engine (GAME-02, GAME-05).
 *
 * The engine is pure TypeScript with no React, DOM, or chat-state imports.
 * Every state transition is a pure function of (state, direction[, rng]).
 */

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Tile {
  /** Stable identity so React can keep tile DOM nodes across moves. */
  id: string;
  value: number;
  row: number;
  col: number;
  /** True only on the turn a merge produced this tile (drives the UI pop). */
  merged?: boolean;
}

/** 4x4 board. `grid[row][col]`; null means an empty cell. */
export type Grid = (Tile | null)[][];

export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  won: boolean;
  gameOver: boolean;
  /** Whether the last move changed the board (no-op moves do not spawn). */
  moved: boolean;
}

/**
 * Injectable random source. Tests pass a seeded function so tile spawning is
 * fully deterministic; production callers default to `Math.random`.
 */
export type Rng = () => number;
