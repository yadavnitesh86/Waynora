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
