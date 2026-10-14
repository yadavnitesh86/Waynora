import "@testing-library/jest-dom/vitest";

// jsdom ships no canvas implementation, and axe-core probes a 2D context while
// checking icon ligatures. Stub it so the expected jsdom "Not implemented"
// noise does not pollute the accessibility suite's output.
const canvasPrototype = (
  globalThis as { HTMLCanvasElement?: { prototype: { getContext?: unknown } } }
).HTMLCanvasElement?.prototype;

if (canvasPrototype) {
  canvasPrototype.getContext = () => ({ measureText: () => ({ width: 0 }) });
}

// jsdom (via vitest in this setup) does not expose `localStorage` on the
// populated global window. Real browsers always have it — Convex auth and the
// 2048 best-score persistence depend on it — so when it is missing, provide a
// minimal in-memory Storage-conformant shim for the test environment only.
// The `window` guard keeps node-environment suites (pure domain tests) working.
if (
  typeof window !== "undefined" &&
  typeof window.localStorage === "undefined"
) {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length(): number {
      return this.store.size;
    }

    clear(): void {
      this.store.clear();
    }

    getItem(key: string): string | null {
      const value = this.store.get(key);
      return value === undefined ? null : value;
    }

    key(index: number): string | null {
      return [...this.store.keys()][index] ?? null;
    }

    removeItem(key: string): void {
      this.store.delete(key);
    }

    setItem(key: string, value: string): void {
      this.store.set(String(key), String(value));
    }
  }

  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}
