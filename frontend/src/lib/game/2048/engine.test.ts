// @vitest-environment node
// Domain tests — pure functions, no DOM required (Phase 02 decision).
import { describe, expect, it } from "vitest";
import type { Grid, GameState, Tile } from "./types";
import {
  GRID_SIZE,
  WIN_VALUE,
  canMove,
  createEmptyGrid,
  hasWon,
  initGame,
  isGameOver,
  moveDown,
  moveGame,
  moveGrid,
  moveLeft,
  moveRight,
  moveUp,
  spawnRandomTile,
} from "./engine";

/** Builds a Grid from a value matrix; 0 means empty. */
function fromValues(values: number[][]): Grid {
  return values.map((row, r) =>
    row.map((value, c): Tile | null =>
      value === 0 ? null : { id: `t-${r}-${c}`, value, row: r, col: c },
    ),
  );
}

/** Extracts a value matrix from a Grid for readable assertions. */
function toValues(grid: Grid): number[][] {
  return grid.map((row) => row.map((tile) => (tile === null ? 0 : tile.value)));
}

describe("createEmptyGrid", () => {
  it("returns a 4x4 grid of empty cells", () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(GRID_SIZE);
    for (const row of grid) {
      expect(row).toHaveLength(GRID_SIZE);
      for (const cell of row) expect(cell).toBeNull();
    }
  });
});

describe("spawnRandomTile", () => {
  it("fills the first empty cell with a 2 when rng is 0", () => {
    const next = spawnRandomTile(createEmptyGrid(), () => 0);
    expect(next[0]?.[0]).not.toBeNull();
    expect(next[0]?.[0]?.value).toBe(2);
    expect(next[0]?.[0]?.row).toBe(0);
    expect(next[0]?.[0]?.col).toBe(0);
  });

  it("spawns a 4 when rng reports the 10% branch", () => {
    // index rng = 0 (first empty cell), value rng = 0.95 (>= 0.9 → 4)
    const seq = [0, 0.95];
    let i = 0;
    const next = spawnRandomTile(
      createEmptyGrid(),
      () => seq[i++ % seq.length] ?? 0,
    );
    expect(next[0]?.[0]?.value).toBe(4);
  });

  it("picks the correct cell for a mid-range index rng", () => {
    // 16 empty cells; index rng 0.5 → floor(8) → the 9th empty cell = (2,0)
    const next = spawnRandomTile(createEmptyGrid(), () => 0.5);
    expect(next[2]?.[0]).not.toBeNull();
    expect(next[0]?.[0]).toBeNull();
  });

  it("returns the same grid when the board is full", () => {
    const full = fromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(spawnRandomTile(full, () => 0)).toBe(full);
  });

  it("does not mutate the input grid", () => {
    const empty = createEmptyGrid();
    spawnRandomTile(empty, () => 0);
    expect(empty[0]?.[0]).toBeNull();
  });
});

describe("initGame", () => {
  it("spawns exactly two tiles at distinct cells", () => {
    const state = initGame(() => 0);
    const tiles = state.grid.flat().filter((t): t is Tile => t !== null);
    expect(tiles).toHaveLength(2);
    expect(tiles[0]?.row === tiles[1]?.row && tiles[0]?.col === tiles[1]?.col).toBe(false);
  });

  it("starts with score 0, no win, no game over, moved false", () => {
    const state = initGame(() => 0);
    expect(state.score).toBe(0);
    expect(state.won).toBe(false);
    expect(state.gameOver).toBe(false);
    expect(state.moved).toBe(false);
  });

  it("carries the provided best score through", () => {
    expect(initGame(() => 0, 1234).bestScore).toBe(1234);
  });
});

describe("moveGrid — sliding and merging", () => {
  it("slides tiles left into the wall", () => {
    const { grid, gained, moved } = moveGrid(
      fromValues([
        [0, 2, 0, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "LEFT",
    );
    expect(toValues(grid)).toEqual([
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(gained).toBe(0);
    expect(moved).toBe(true);
  });

  it("merges a pair and scores the merged value", () => {
    const { grid, gained } = moveGrid(
      fromValues([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "LEFT",
    );
    expect(toValues(grid)[0]).toEqual([4, 0, 0, 0]);
    expect(gained).toBe(4);
  });

  it("merges cascades and accumulates standard 2048 score", () => {
    // [2,2,2,2] → [4,4], score 4+4 = 8
    const { grid, gained } = moveGrid(
      fromValues([
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "LEFT",
    );
    expect(toValues(grid)[0]).toEqual([4, 4, 0, 0]);
    expect(gained).toBe(8);
  });

  it("never merges a tile twice in one move", () => {
    // [4,4,8,0] → [8,8,0,0], not [16,0,0,0]
    const { grid } = moveGrid(
      fromValues([
        [4, 4, 8, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "LEFT",
    );
    expect(toValues(grid)[0]).toEqual([8, 8, 0, 0]);
  });

  it("merges only into the wall direction: [2,2,4] LEFT is [4,4]", () => {
    const { grid } = moveGrid(
      fromValues([
        [2, 2, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "LEFT",
    );
    expect(toValues(grid)[0]).toEqual([4, 4, 0, 0]);
  });

  it("reports moved=false when nothing changes", () => {
    const { grid, gained, moved } = moveGrid(
      fromValues([
        [2, 4, 2, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "LEFT",
    );
    expect(moved).toBe(false);
    expect(gained).toBe(0);
    expect(toValues(grid)[0]).toEqual([2, 4, 2, 4]);
  });

  it("flags the merged tile for the UI pop", () => {
    const { grid } = moveGrid(
      fromValues([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "LEFT",
    );
    expect(grid[0]?.[0]?.merged).toBe(true);
    expect(grid[0]?.[0]?.value).toBe(4);
  });
});

describe("moveGrid — all four directions", () => {
  it("moveRight slides and merges to the right wall", () => {
    const { grid } = moveGrid(
      fromValues([
        [2, 2, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "RIGHT",
    );
    expect(toValues(grid)[0]).toEqual([0, 0, 4, 4]);
  });

  it("moveUp slides and merges to the top wall", () => {
    const { grid } = moveGrid(
      fromValues([
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [4, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "UP",
    );
    expect(toValues(grid).map((row) => row[0])).toEqual([4, 4, 0, 0]);
  });

  it("moveDown slides and merges to the bottom wall", () => {
    const { grid } = moveGrid(
      fromValues([
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [4, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "DOWN",
    );
    // [2,2,4,·] DOWN: 4 lands on the wall (row 3), the 2s merge above it.
    expect(toValues(grid).map((row) => row[0])).toEqual([0, 0, 4, 4]);
  });

  it("direction helpers delegate to moveGrid", () => {
    const base = fromValues([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(toValues(moveLeft(base).grid)[0]).toEqual([4, 0, 0, 0]);
    expect(toValues(moveRight(base).grid)[0]).toEqual([0, 0, 0, 4]);

    const vertical = fromValues([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(toValues(moveUp(vertical).grid).map((r) => r[0])).toEqual([4, 0, 0, 0]);
    expect(toValues(moveDown(vertical).grid).map((r) => r[0])).toEqual([0, 0, 0, 4]);
  });
});

describe("canMove / isGameOver / hasWon", () => {
  it("canMove is true when an empty cell exists", () => {
    const grid = fromValues([
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 0],
    ]);
    expect(canMove(grid)).toBe(true);
    expect(isGameOver(grid)).toBe(false);
  });

  it("canMove is true for an adjacent equal pair on a full board", () => {
    const grid = fromValues([
      [2, 2, 4, 8],
      [16, 32, 64, 128],
      [256, 512, 1024, 2],
      [4, 8, 16, 32],
    ]);
    expect(canMove(grid)).toBe(true);
  });

  it("isGameOver is true when full with no adjacent equals", () => {
    const grid = fromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(canMove(grid)).toBe(false);
    expect(isGameOver(grid)).toBe(true);
  });

  it("hasWon is true only when a tile reached 2048", () => {
    const nearMiss = fromValues([
      [1024, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const won = fromValues([
      [WIN_VALUE, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(hasWon(nearMiss)).toBe(false);
    expect(hasWon(won)).toBe(true);
  });
});

describe("moveGame — full state transitions", () => {
  function stateOf(grid: number[][], overrides: Partial<GameState> = {}): GameState {
    return {
      grid: fromValues(grid),
      score: 0,
      bestScore: 0,
      won: false,
      gameOver: false,
      moved: false,
      ...overrides,
    };
  }

  it("spawns exactly one tile after a successful move", () => {
    const before = stateOf([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = moveGame(before, "LEFT", () => 0);
    const tiles = next.grid.flat().filter((t): t is Tile => t !== null);
    expect(tiles).toHaveLength(2); // merged survivor + spawned tile
    expect(next.moved).toBe(true);
    // Spawn at first empty cell (0,1) with value 2 (rng 0 < 0.9)
    expect(next.grid[0]?.[1]?.value).toBe(2);
  });

  it("does not spawn on a no-op move", () => {
    const before = stateOf([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    const next = moveGame(before, "LEFT", () => 0);
    expect(next.moved).toBe(false);
    expect(toValues(next.grid)).toEqual(toValues(before.grid));
    expect(next.gameOver).toBe(true);
  });

  it("accumulates score and keeps bestScore monotonic", () => {
    const before = stateOf(
      [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      { bestScore: 100 },
    );
    const next = moveGame(before, "LEFT", () => 0);
    expect(next.score).toBe(4);
    expect(next.bestScore).toBe(100); // best never decreases
  });

  it("raises bestScore when the current score passes it", () => {
    const before = stateOf(
      [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      { bestScore: 2 },
    );
    expect(moveGame(before, "LEFT", () => 0).bestScore).toBe(4);
  });

  it("sets won when a merge reaches 2048", () => {
    const before = stateOf([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = moveGame(before, "LEFT", () => 0);
    expect(next.won).toBe(true);
    expect(next.grid[0]?.[0]?.value).toBe(WIN_VALUE);
  });

  it("keeps won sticky across subsequent moves (Keep Going)", () => {
    const before = stateOf(
      [
        [WIN_VALUE, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      { won: true },
    );
    const next = moveGame(before, "RIGHT", () => 0);
    expect(next.won).toBe(true);
  });

  it("sets gameOver when a move fills the last gap with no pairs left", () => {
    // RIGHT slide opens (2,0); rng 0 spawns a 2 there, leaving a full board
    // with no adjacent equal pair.
    const before = stateOf([
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 0],
      [4, 8, 16, 32],
    ]);
    const next = moveGame(before, "RIGHT", () => 0);
    expect(next.moved).toBe(true);
    expect(next.gameOver).toBe(true);
  });

  it("never mutates the input state", () => {
    const before = stateOf([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const snapshot = toValues(before.grid);
    moveGame(before, "LEFT", () => 0);
    expect(toValues(before.grid)).toEqual(snapshot);
    expect(before.score).toBe(0);
  });
});
