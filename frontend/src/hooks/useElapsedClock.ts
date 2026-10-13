import { useEffect, useState } from "react";

/**
 * Elapsed clock (WAIT-06): ticks every 1000ms, returns milliseconds since
 * mount, clears its interval on unmount. Re-renders only the component that
 * calls it — the memoized transcript never sees the per-second tick.
 */
export function useElapsedClock(): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return elapsed;
}
