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
    const { result } = renderHook(() => useElapsedClock());
    expect(result.current).toBe(0);
  });

  it("ticks every 1000ms", () => {
    const { result } = renderHook(() => useElapsedClock());

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
    const { result, unmount } = renderHook(() => useElapsedClock());

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
});
