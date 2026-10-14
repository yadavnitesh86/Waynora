/**
 * Pure, deterministic 2048 engine (GAME-02, GAME-05).
 *
 * Rules implemented (standard 2048):
 * - Tiles slide as far as possible in the move direction.
 * - Two equal tiles colliding merge into one with double the value.
 * - A tile produced by a merge cannot merge again on the same move.
 * - Each successful move spawns one random tile (90% "2", 10% "4").
 * - A move that changes nothing is a no-op: no spawn, no score change.
 * - Reaching a 2048 tile is a win; a full board with no adjacent equal
 *   tiles is game over.
 *
 * Purity: every exported function returns new state and never mutates its
 * input. The only module-level state is a monotonic tile-id counter, which
 * affects ids only — never values, positions, scores, or outcomes.
 */

import type { Direction, Grid, GameState, Rng, Tile } from "./types";

export const GRID_SIZE = 4;
export const WIN_VALUE = 2048;

let tileIdCounter = 0;

function nextTileId(): string {
  tileIdCounter += 1;
  return `tile-${tileIdCounter}`;
}

/** Safe 4x4 cell read — the grid type is (Tile | null)[][], never sparse. */
function cellAt(grid: Grid, row: number, col: number): Tile | null {
  return grid[row]?.[col] ?? null;
}

/** Safe 4x4 cell write into a grid row we own. */
function setCell(grid: Grid, row: number, col: number, tile: Tile | null): void {
  const gridRow = grid[row];
  if (gridRow) {
    gridRow[col] = tile;
  }
}

/** A fresh 4x4 board of empty cells. */
export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from<Tile, Tile | null>({ length: GRID_SIZE }, () => null),
  );
}

/**
 * Places one random tile (90% "2", 10% "4") in a uniformly chosen empty
 * cell. Pass `rng` for seeded, deterministic spawns. Returns the input grid
 * unchanged when the board is full.
 */
export function spawnRandomTile(grid: Grid, rng: Rng = Math.random): Grid {
  const empty: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (cellAt(grid, row, col) === null) {
        empty.push({ row, col });
      }
    }
  }
  if (empty.length === 0) {
    return grid;
  }
  // Clamp so a rng() returning exactly 1 still picks a valid cell.
  const rawIndex = Math.floor(rng() * empty.length);
  const index = Math.min(Math.max(rawIndex, 0), empty.length - 1);
  const value = rng() < 0.9 ? 2 : 4;

  const next = grid.map((row) => row.slice());
  const picked = empty[index];
  if (picked === undefined) {
    return grid;
  }
  setCell(next, picked.row, picked.col, {
    id: nextTileId(),
    value,
    row: picked.row,
    col: picked.col,
  });
  return next;
}

/** New game: empty board, two spawned tiles, score reset, best preserved. */
export function initGame(rng: Rng = Math.random, bestScore = 0): GameState {
  const grid = spawnRandomTile(spawnRandomTile(createEmptyGrid(), rng), rng);
  return {
    grid,
    score: 0,
    bestScore,
    won: false,
    gameOver: false,
    moved: false,
  };
}

export interface MoveResult {
  grid: Grid;
  /** Score gained from merges in this move. */
  gained: number;
  /** Whether the board changed at all. */
  moved: boolean;
}

/**
 * Reads one of the 4 lines (row or column) in "towards the wall" order:
 * index 0 is the cell that ends up against the wall for this direction.
 */
function readLine(grid: Grid, direction: Direction, line: number): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    let tile: Tile | null;
    if (direction === "LEFT") tile = cellAt(grid, line, i);
    else if (direction === "RIGHT") tile = cellAt(grid, line, GRID_SIZE - 1 - i);
    else if (direction === "UP") tile = cellAt(grid, i, line);
    else tile = cellAt(grid, GRID_SIZE - 1 - i, line);
    if (tile !== null) tiles.push(tile);
  }
  return tiles;
}

/**
 * Slides and merges one line toward the wall. A merged tile carries the
 * `merged` flag (for the UI pop) and cannot merge again this move.
 */
function compact(tiles: Tile[]): { tiles: Tile[]; gained: number } {
  const out: Tile[] = [];
  let gained = 0;
  for (const tile of tiles) {
    const prev = out[out.length - 1];
    if (prev !== undefined && prev.value === tile.value && !prev.merged) {
      const merged: Tile = { ...prev, value: prev.value * 2, merged: true };
      out[out.length - 1] = merged;
      gained += merged.value;
    } else {
      // Clear stale merged flags from previous moves.
      out.push({ ...tile, merged: false });
    }
  }
  return { tiles: out, gained };
}

/** Writes compacted tiles back into the grid with fresh coordinates. */
function writeLine(
  grid: Grid,
  direction: Direction,
  line: number,
  tiles: Tile[],
): void {
  tiles.forEach((tile, i) => {
    let row: number;
    let col: number;
    if (direction === "LEFT") [row, col] = [line, i];
    else if (direction === "RIGHT") [row, col] = [line, GRID_SIZE - 1 - i];
    else if (direction === "UP") [row, col] = [i, line];
    else [row, col] = [GRID_SIZE - 1 - i, line];
    setCell(grid, row, col, { ...tile, row, col });
  });
}

/**
 * Slides and merges every line in the given direction. Pure: returns a new
 * grid; the input is untouched. Standard 2048 scoring: each merge adds the
 * merged tile's new value.
 */
export function moveGrid(grid: Grid, direction: Direction): MoveResult {
  const next = createEmptyGrid();
  let gained = 0;
  for (let line = 0; line < GRID_SIZE; line += 1) {
    const { tiles, gained: lineGained } = compact(
      readLine(grid, direction, line),
    );
    writeLine(next, direction, line, tiles);
    gained += lineGained;
  }

  let moved = false;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const before = cellAt(grid, row, col);
      const after = cellAt(next, row, col);
      if (
        (before === null) !== (after === null) ||
        (before !== null && after !== null && before.id !== after.id)
      ) {
        moved = true;
      }
    }
  }
  return { grid: next, gained, moved };
}

/** True if any empty cell exists or any adjacent pair is equal. */
export function canMove(grid: Grid): boolean {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const tile = cellAt(grid, row, col);
      if (tile === null) return true;
      if (col + 1 < GRID_SIZE) {
        const right = cellAt(grid, row, col + 1);
        if (right !== null && right.value === tile.value) return true;
      }
      if (row + 1 < GRID_SIZE) {
        const down = cellAt(grid, row + 1, col);
        if (down !== null && down.value === tile.value) return true;
      }
    }
  }
  return false;
}

/** True if no empty cell and no adjacent equal pair remain. */
export function isGameOver(grid: Grid): boolean {
  return !canMove(grid);
}

/** True if any tile has reached the win value (2048). */
export function hasWon(grid: Grid): boolean {
  for (const row of grid) {
    for (const tile of row) {
      if (tile !== null && tile.value >= WIN_VALUE) return true;
    }
  }
  return false;
}

/**
 * Applies one move to the full game state. No-op moves return the state
 * with `moved: false` (no spawn, no score change). Successful moves spawn
 * exactly one tile, accumulate merge score, keep the best score monotonic,
 * and keep `won` sticky so "Keep Going" play continues to report the win.
 */
export function moveGame(
  state: GameState,
  direction: Direction,
  rng: Rng = Math.random,
): GameState {
  const { grid: slid, gained, moved } = moveGrid(state.grid, direction);
  if (!moved) {
    return { ...state, moved: false, gameOver: isGameOver(state.grid) };
  }
  const grid = spawnRandomTile(slid, rng);
  const score = state.score + gained;
  return {
    grid,
    score,
    bestScore: Math.max(state.bestScore, score),
    won: state.won || hasWon(grid),
    gameOver: isGameOver(grid),
    moved: true,
  };
}

export function moveLeft(grid: Grid): MoveResult {
  return moveGrid(grid, "LEFT");
}

export function moveRight(grid: Grid): MoveResult {
  return moveGrid(grid, "RIGHT");
}

export function moveUp(grid: Grid): MoveResult {
  return moveGrid(grid, "UP");
}

export function moveDown(grid: Grid): MoveResult {
  return moveGrid(grid, "DOWN");
}

export type { Direction, Grid, GameState, Rng, Tile } from "./types";
