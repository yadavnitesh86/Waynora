import { renderHook, act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useElapsedClock } from "./useElapsedClock";

describe("useElapsedClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts at 0", () => {
    const { result } = renderHook(() => useElapsedClock(true));
    expect(result.current).toBe(0);
  });

  it("ticks every 1000ms while active", () => {
    const { result } = renderHook(() => useElapsedClock(true));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBeGreaterThanOrEqual(1000);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBeGreaterThanOrEqual(2000);
  });

  it("clears the interval on unmount", () => {
    const { result, unmount } = renderHook(() => useElapsedClock(true));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const valueBefore = result.current;
    expect(valueBefore).toBeGreaterThanOrEqual(1000);

    unmount();

    // Advance well past another tick — the hook must not update after unmount.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // result.current stays at the last value before unmount (no state update)
    expect(result.current).toBe(valueBefore);
  });

  it("stays at 0 and never ticks while inactive (idle route accumulates no time)", () => {
    const { result } = renderHook(() => useElapsedClock(false));

    act(() => {
      vi.advanceTimersByTime(600_000);
    });
    expect(result.current).toBe(0);
  });

  it("resets to 0 when deactivated and restarts from 0 on the next request", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useElapsedClock(active),
      { initialProps: { active: false } },
    );

    // Four minutes of idle time before any request — must not accumulate.
    act(() => {
      vi.advanceTimersByTime(240_000);
    });
    expect(result.current).toBe(0);

    // Request starts: baseline captured now, ticks from 0.
    rerender({ active: true });
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBeGreaterThanOrEqual(2000);

    // Request ends: readout resets for the next one.
    rerender({ active: false });
    expect(result.current).toBe(0);
  });
});
