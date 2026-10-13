import { useEffect, useState } from "react";

/**
 * Elapsed clock (WAIT-06, WAIT-03): ticks every 1000ms and returns the
 * milliseconds elapsed SINCE THE REQUEST STARTED — not since mount. The
 * clock is active-gated: the baseline is captured (and the readout reset
 * to 0) when `active` flips true, and the interval is torn down when it
 * flips false, so an idle route accumulates no time and a new request
 * always opens at 0:00 / band A (03-UI-SPEC: submitting → "0:00").
 *
 * Clears its interval on unmount. Re-renders only the component that
 * calls it — the memoized transcript never sees the per-second tick.
 */
export function useElapsedClock(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  return elapsed;
}
