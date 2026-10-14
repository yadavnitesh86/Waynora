import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WaitingShell from "./WaitingShell";

describe("WaitingShell", () => {
  it("renders the C-10 heading", () => {
    render(<WaitingShell elapsedMs={0} onStop={() => {}} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Waynora is planning your trip" }),
    ).toBeInTheDocument();
  });

  it("renders the C-11 Elapsed label and C-13 expectation", () => {
    render(<WaitingShell elapsedMs={0} onStop={() => {}} />);
    expect(screen.getByText("Elapsed")).toBeInTheDocument();
    expect(screen.getByText("Plans usually take 5 to 15 minutes.")).toBeInTheDocument();
  });

  it("renders the C-14 Stop waiting button", () => {
    render(<WaitingShell elapsedMs={0} onStop={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Stop waiting" }),
    ).toBeInTheDocument();
  });

  it("renders band A variant 1 at 0ms", () => {
    render(<WaitingShell elapsedMs={0} onStop={() => {}} />);
    expect(screen.getByText("Reading your request.")).toBeInTheDocument();
  });

  it("renders band B at 60_000ms", () => {
    render(<WaitingShell elapsedMs={60_000} onStop={() => {}} />);
    // Band B variant: floor(60000/45000)%2 = 1
    expect(screen.getByText("Looking at places that fit your trip.")).toBeInTheDocument();
  });

  it("renders band C at 299_999ms", () => {
    render(<WaitingShell elapsedMs={299_999} onStop={() => {}} />);
    // floor(299999/45000)%2 = 6%2 = 0 -> variant 0
    expect(screen.getByText("Checking routes and places to stay.")).toBeInTheDocument();
  });

  it("renders band F at 900_000ms", () => {
    render(<WaitingShell elapsedMs={900_000} onStop={() => {}} />);
    // floor(900000/45000)%2 = 20%2 = 0 -> variant 1
    expect(
      screen.getByText(
        "This is taking longer than usual. Keep waiting, or stop and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("the band-copy region has aria-live=polite and aria-atomic=true", () => {
    render(<WaitingShell elapsedMs={0} onStop={() => {}} />);
    const liveRegion = screen.getByText("Reading your request.").closest("[aria-live]");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("the elapsed readout does NOT have aria-live", () => {
    render(
      <WaitingShell elapsedMs={65_000} onStop={() => {}} />,
    );
    // The readout "1:05" must not be inside a live region
    const readout = screen.getByText("1:05");
    expect(readout.closest("[aria-live]")).toBeNull();
    // But the band copy is in a live region (band B variant 1 at 65_000ms)
    const bandCopy = screen.getByText("Looking at places that fit your trip.");
    expect(bandCopy.closest("[aria-live]")).not.toBeNull();
  });

  it("has no progress/meter element and no percentage text", () => {
    const { container } = render(
      <WaitingShell elapsedMs={0} onStop={() => {}} />,
    );
    expect(container.querySelector("progress")).toBeNull();
    expect(container.querySelector("meter")).toBeNull();
    expect(container.textContent).not.toMatch(/\d+%/);
  });

  it("calls onStop when Stop waiting is clicked", () => {
    const onStop = vi.fn();
    render(<WaitingShell elapsedMs={0} onStop={onStop} />);
    fireEvent.click(screen.getByRole("button", { name: "Stop waiting" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});

describe("WaitingShell x 2048 waiting lounge (GAME-01, GAME-06)", () => {
  it("mounts the 2048 board only while the request is actively waiting", () => {
    const { rerender } = render(
      <WaitingShell elapsedMs={0} onStop={() => {}} isWaiting />,
    );
    expect(
      screen.getByRole("grid", { name: "2048 game board" }),
    ).toBeInTheDocument();

    // Status left `waiting` (submitting phase or a terminal state): the
    // board must be gone — GAME-01 keys the game on active waiting only.
    rerender(<WaitingShell elapsedMs={0} onStop={() => {}} isWaiting={false} />);
    expect(
      screen.queryByRole("grid", { name: "2048 game board" }),
    ).toBeNull();
    // The timing copy stays put in both phases.
    expect(
      screen.getByText("Plans usually take 5 to 15 minutes."),
    ).toBeInTheDocument();
  });

  it("keeps the elapsed readout and band copy ticking through a game move", () => {
    const { rerender } = render(
      <WaitingShell elapsedMs={0} onStop={() => {}} isWaiting />,
    );
    const board = screen.getByRole("grid", { name: "2048 game board" });

    // A real game move while the clock advances: the shell copy is a pure
    // function of elapsed, unaffected by anything on the board.
    fireEvent.keyDown(board, { key: "ArrowLeft" });
    rerender(
      <WaitingShell elapsedMs={65_000} onStop={() => {}} isWaiting />,
    );
    expect(screen.getByText("1:05")).toBeInTheDocument();
    expect(
      screen.getByText("Looking at places that fit your trip."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("grid", { name: "2048 game board" }),
    ).toBeInTheDocument();
  });

  it("triggers the abort handler on Stop waiting without game interference", () => {
    const onStop = vi.fn();
    render(<WaitingShell elapsedMs={0} onStop={onStop} isWaiting />);

    // Game keys belong to the board, never to the request lifecycle.
    fireEvent.keyDown(screen.getByRole("grid", { name: "2048 game board" }), {
      key: "ArrowUp",
    });
    expect(onStop).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Stop waiting" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
