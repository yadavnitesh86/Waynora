import type { Tile as TileData } from "../../lib/game/2048/types";

/**
 * Distinctive value-based color tokens, kept inside the locked palette
 * (01-UI-SPEC tokens.css) enhanced with luxury gold and verdigris depth.
 * The ramp runs warm-neutral → soft teal → warm gold → burnt orange → deep rose →
 * deep verdigris → obsidian gold, so tile value is legible by color as well as by numeral.
 */
const VALUE_STYLES: Record<number, string> = {
  2: "bg-surface border border-line text-ink shadow-2xs",
  4: "bg-accent-soft border border-line text-ink shadow-2xs",
  8: "bg-line border border-line text-ink shadow-2xs",
  16: "bg-focus border border-transparent text-accent-ink shadow-xs",
  32: "bg-danger border border-transparent text-accent-ink shadow-xs",
  64: "bg-accent border border-transparent text-accent-ink shadow-sm ring-1 ring-gold/40",
  128: "bg-ink border border-transparent text-surface shadow-md",
  256: "bg-ink border border-transparent text-accent-soft shadow-md",
  512: "bg-ink border border-transparent text-focus shadow-md",
  1024: "bg-ink border-2 border-accent text-accent-ink shadow-luxury ring-1 ring-gold/50",
  2048: "bg-ink border-2 border-focus text-accent-ink shadow-luxury ring-2 ring-gold",
};

const DEFAULT_STYLE = "bg-ink border-2 border-accent text-accent-ink shadow-luxury";

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
 * A single 2048 tile: value-driven luxury color token, tabular mono-style numeral
 * scale, and a one-shot scale/opacity pop for new and merged tiles. Motion
 * is opacity/transform at 200ms ease-out only and honors
 * `prefers-reduced-motion` (both via `motion-reduce:` and the global
 * override in globals.css).
 */
export default function Tile({ tile }: TileProps) {
  const { value, merged } = tile;
  const colorClass = VALUE_STYLES[value] ?? DEFAULT_STYLE;

  const animationClass = merged
    ? "animate-tile-merge motion-reduce:animate-none"
    : "animate-tile-in motion-reduce:animate-none";

  return (
    <div
      className={[
        "flex h-full w-full items-center justify-center rounded-lg select-none",
        "font-display font-bold tabular-nums tracking-tight",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform duration-150",
        valueFontSize(value),
        animationClass,
        colorClass,
      ].join(" ")}
    >
      {value}
    </div>
  );
}
