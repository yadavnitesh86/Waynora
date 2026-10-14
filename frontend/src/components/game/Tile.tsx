import type { Tile as TileData } from "../../lib/game/2048/types";

/**
 * Distinctive value-based color tokens, kept inside the locked palette
 * (01-UI-SPEC tokens.css). The ramp runs warm-neutral → soft teal →
 * burnt orange → deep rose → deep teal → inverted ink, so tile value is
 * legible by color as well as by the numeral. No new CSS variables are
 * introduced; the spec owns tokens.css.
 */
const VALUE_STYLES: Record<number, string> = {
  2: "bg-surface border border-line text-ink",
  4: "bg-accent-soft border border-line text-ink",
  8: "bg-line border border-line text-ink",
  16: "bg-focus border border-transparent text-accent-ink",
  32: "bg-danger border border-transparent text-accent-ink",
  64: "bg-accent border border-transparent text-accent-ink",
  128: "bg-ink border border-transparent text-surface",
  256: "bg-ink border border-transparent text-accent-soft",
  512: "bg-ink border border-transparent text-focus",
  1024: "bg-ink border-2 border-accent text-accent-ink",
  2048: "bg-ink border-2 border-focus text-accent-ink",
};

const DEFAULT_STYLE = "bg-ink border-2 border-accent text-accent-ink";

/** Larger numerals for larger values, capped to keep 4-digit tiles on one line. */
function valueFontSize(value: number): string {
  if (value < 100) return "text-h3";
  if (value < 1000) return "text-small";
  return "text-caption";
}

export interface TileProps {
  tile: TileData;
}

/**
 * A single 2048 tile: value-driven color token, tabular mono-style numeral
 * scale, and a one-shot scale/opacity pop for new and merged tiles. Motion
 * is opacity/transform at 200ms ease-out only and honors
 * `prefers-reduced-motion` (both via `motion-reduce:` and the global
 * override in globals.css).
 */
export default function Tile({ tile }: TileProps) {
  const { value, merged } = tile;
  const colorClass = VALUE_STYLES[value] ?? DEFAULT_STYLE;
  // New tiles pop in from small; merged tiles get a merge pulse. Both are
  // opacity/transform at 200ms ease-out (locked motion contract) and are
  // collapsed by the global prefers-reduced-motion override plus the
  // per-class `motion-reduce:` guards below.
  const animationClass = merged
    ? "animate-tile-merge motion-reduce:animate-none"
    : "animate-tile-in motion-reduce:animate-none";

  return (
    <div
      className={[
        "flex h-full w-full items-center justify-center rounded-md",
        "font-display font-semibold tabular-nums",
        valueFontSize(value),
        animationClass,
        colorClass,
      ].join(" ")}
    >
      {value}
    </div>
  );
}
