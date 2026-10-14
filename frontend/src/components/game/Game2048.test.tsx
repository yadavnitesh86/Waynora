import { render, screen, within, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Game2048 from "./Game2048";
import type { GameState } from "../../lib/game/2048/types";
import type { Grid, Tile } from "../../lib/game/2048/types";
import { expectNoAxeViolations } from "../../test/axe";

/** Builds a Grid from a value matrix; 0 means empty. */
function fromValues(values: number[][]): Grid {
  return values.map((row, r) =>
    row.map((value, c): Tile | null =>
      value === 0 ? null : { id: `t-${r}-${c}`, value, row: r, col: c },
    ),
  );
}

function stateOf(
  values: number[][],
  overrides: Partial<GameState> = {},
): GameState {
  return {
    grid: fromValues(values),
    score: 0,
    bestScore: 0,
    won: false,
    gameOver: false,
    moved: false,
    ...overrides,
  };
}

/** Seeded rng: always 0 → spawns a "2" in the first empty cell. */
const rng = () => 0;

/** Initial board with rng 0: two "2" tiles at (0,0) and (0,1). */
function renderGame(props: Parameters<typeof Game2048>[0] = {}) {
  return render(<Game2048 rng={rng} {...props} />);
}

function board(): HTMLElement {
  return screen.getByRole("grid", { name: "2048 game board" });
}

function emptyBoardState(): number[][] {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("Game2048 — layout and ARIA", () => {
  it("renders the board grid, scores, hints, and touch controls", () => {
    renderGame();
    expect(board()).toBeInTheDocument();
    expect(screen.getByText("Current Score")).toBeInTheDocument();
    expect(screen.getByText("Best Score")).toBeInTheDocument();
    expect(
      screen.getByText("Use arrow keys or WASD to move tiles"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Swipe or tap arrows to move tiles"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Touch direction controls" }),
    ).toBeInTheDocument();
    for (const label of ["Move up", "Move down", "Move left", "Move right"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders 16 labelled grid cells", () => {
    renderGame();
    const cells = within(board()).getAllByRole("gridcell");
    expect(cells).toHaveLength(16);
    // rng 0 spawns two 2s at (0,0) and (0,1); the rest are empty.
    expect(screen.getAllByLabelText("Tile 2")).toHaveLength(2);
    expect(screen.getAllByLabelText("Empty")).toHaveLength(14);
  });

  it("has a polite score status region for screen readers", () => {
    renderGame();
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Score: 0.");
  });

  it("passes axe-core with no critical or serious violations", async () => {
    const { container } = renderGame();
    await expectNoAxeViolations(container);
  });
});

describe("Game2048 — keyboard controls (desktop)", () => {
  it("ArrowLeft on the board merges tiles and scores", () => {
    renderGame();
    fireEvent.keyDown(board(), { key: "ArrowLeft" });
    // [2,2,·,·] → [4,·,·,·]; spawn lands at (0,1) with value 2.
    expect(screen.getByLabelText("Tile 4")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Tile 2")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Score: 4.");
  });

  it("supports WASD keys", () => {
    renderGame();
    fireEvent.keyDown(board(), { key: "d" });
    // [2,2,·,·] RIGHT → [·,·,·,4] (the pair merges at the right wall);
    // spawn lands at the first empty cell (0,0) with value 2.
    expect(screen.getByLabelText("Tile 4")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Tile 2")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Score: 4.");
  });

  it("ignores arrow keys while a text input is focused (GAME-06)", () => {
    render(
      <>
        <textarea aria-label="Your trip request" />
        <Game2048 rng={rng} />
      </>,
    );
    const textarea = screen.getByLabelText("Your trip request");
    textarea.focus();
    fireEvent.keyDown(board(), { key: "ArrowLeft" });
    expect(screen.queryByLabelText("Tile 4")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Score: 0.");
  });

  it("prevents default only for handled game keys on the board", () => {
    renderGame();
    // Non-game keys must keep their default behaviour (e.g. page scroll).
    expect(fireEvent.keyDown(board(), { key: "Enter" })).toBe(true);
    // Game keys are consumed so the page never scrolls under the board.
    expect(fireEvent.keyDown(board(), { key: "ArrowLeft" })).toBe(false);
  });
});

describe("Game2048 — touch controls (mobile)", () => {
  it("a rightward swipe moves tiles right", () => {
    renderGame();
    fireEvent.touchStart(board(), { touches: [{ clientX: 10, clientY: 10 }] });
    fireEvent.touchEnd(board(), {
      changedTouches: [{ clientX: 100, clientY: 12 }],
    });
    // Same as ArrowRight: the pair merges at the right wall, spawn at (0,0).
    expect(screen.getByLabelText("Tile 4")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Tile 2")).toHaveLength(1);
  });

  it("ignores a swipe below the threshold", () => {
    renderGame();
    fireEvent.touchStart(board(), { touches: [{ clientX: 10, clientY: 10 }] });
    fireEvent.touchEnd(board(), {
      changedTouches: [{ clientX: 20, clientY: 11 }],
    });
    expect(screen.queryByLabelText("Tile 4")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Tile 2")).toHaveLength(2);
  });

  it("the on-screen directional buttons move tiles", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Move right" }));
    expect(screen.getByLabelText("Tile 4")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Tile 2")).toHaveLength(1);
  });
});

describe("Game2048 — win and game over", () => {
  it("shows the win overlay with Keep Going and New Game", () => {
    const values = emptyBoardState();
    values[0] = [2048, 2, 0, 0];
    renderGame({ initialState: stateOf(values, { won: true }) });

    expect(
      screen.getByText("You win!", { selector: "h3" }),
    ).toBeInTheDocument();
    const overlay = screen.getByText("You win!").closest("div[role='status']");
    expect(overlay).not.toBeNull();
    expect(
      within(overlay as HTMLElement).getByRole("button", { name: "Keep Going" }),
    ).toBeInTheDocument();
    expect(
      within(overlay as HTMLElement).getByRole("button", { name: "New Game" }),
    ).toBeInTheDocument();
    // The overlay announces its outcome via a status region.
    expect(
      screen.getAllByRole("status").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("Keep Going dismisses the overlay and play continues", () => {
    const values = emptyBoardState();
    values[0] = [2048, 2, 2, 0];
    renderGame({ initialState: stateOf(values, { won: true }) });

    fireEvent.click(screen.getByRole("button", { name: "Keep Going" }));
    expect(screen.queryByText("You win!")).not.toBeInTheDocument();

    fireEvent.keyDown(board(), { key: "ArrowLeft" });
    expect(screen.getByLabelText("Tile 2048")).toBeInTheDocument();
  });

  it("shows Game Over with Try Again, which starts a fresh game", () => {
    renderGame({
      initialState: stateOf(
        [
          [2, 4, 2, 4],
          [4, 2, 4, 2],
          [2, 4, 2, 4],
          [4, 2, 4, 2],
        ],
        { gameOver: true },
      ),
    });

    expect(
      screen.getByText("Game Over", { selector: "h3" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

    expect(screen.queryByText("Game Over")).not.toBeInTheDocument();
    // Fresh board from rng: two "2" tiles again.
    expect(screen.getAllByLabelText("Tile 2")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("Score: 0.");
  });
});

describe("Game2048 — best score persistence", () => {
  it("persists the best score to localStorage and restores it", () => {
    const { unmount } = renderGame();
    fireEvent.keyDown(board(), { key: "ArrowLeft" });
    expect(window.localStorage.getItem("waynora:2048:best")).toBe("4");
    unmount();

    renderGame();
    expect(screen.getByText("Best Score").parentElement).toHaveTextContent("4");
    expect(screen.getByRole("status")).toHaveTextContent("Best score: 4.");
  });

  it("survives a storage access failure without crashing", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    try {
      renderGame();
      expect(board()).toBeInTheDocument();
      expect(screen.getByText("Best Score").parentElement).toHaveTextContent(
        "0",
      );
    } finally {
      vi.restoreAllMocks();
    }
  });
});
