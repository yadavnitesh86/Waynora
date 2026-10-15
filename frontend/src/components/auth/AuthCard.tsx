import type { ReactNode } from "react";
import { PageHeader } from "../ui";
import SkeletonLoader from "../ui/SkeletonLoader";

export interface AuthCardProps {
  title: string;
  children?: ReactNode;
}

/**
 * Shared luxury auth card shell (Option A — Split panel per 05-UI-SPEC Surface 3).
 *
 * Desktop:
 * - Left panel (5 cols, `--color-surface-dark`): Waynora wordmark + brand logo + editorial tagline
 * - Right panel (7 cols, `--color-surface`): centered auth form
 * Mobile:
 * - Stacks vertically; dark panel becomes an elegant brand bar at top
 *
 * Protected route session check renders a clean skeleton loader inside when children are absent.
 */
export default function AuthCard({ title, children }: AuthCardProps) {
  const isLoading = children === undefined;

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-md py-xl md:py-3xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[58rem] rounded-[2.5rem] border border-gold/30 bg-surface/80 p-2 shadow-luxury backdrop-blur-md">
        <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] border border-line/70 bg-surface shadow-sm grid grid-cols-1 md:grid-cols-12 transition-all">
          {/* Left Editorial Brand Panel */}
          <div className="md:col-span-5 bg-surface-dark text-ink-inverse p-lg sm:p-xl md:p-2xl flex flex-col justify-between border-b md:border-b-0 md:border-r border-line/20 relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 opacity-[0.05] pointer-events-none select-none">
              <span className="font-display text-[16rem] font-bold text-gold">W</span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-surface-dark-raised p-1 shadow-2xs">
                  <img
                    src="/logo.png"
                    alt="Waynora Logo"
                    className="h-7 w-7 object-contain"
                  />
                </div>
                <div>
                  <span className="font-display text-h3 font-semibold text-ink-inverse tracking-tight block">
                    Waynora
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-gold font-bold">
                    Private Atelier
                  </span>
                </div>
              </div>

              <div className="mt-2xl hidden md:block">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface-dark-raised px-3 py-1 mb-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-subtle" />
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-gold">
                    Specialist Intelligence
                  </p>
                </div>
                <p className="font-display text-h2 font-normal text-ink-inverse leading-snug">
                  Travel itineraries crafted by coordinated specialists, not generic single-shot prompts.
                </p>
              </div>
            </div>

            <div className="relative z-10 hidden md:flex flex-col gap-sm border-t border-line/15 pt-md mt-xl">
              <div className="flex items-center gap-xs text-caption text-ink-inverse-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Honest planning • 5–15 min generation</span>
              </div>
              <div className="text-[10px] font-mono text-gold-muted/80">
                35°41′N 139°41′E • 45°26′N 9°11′E
              </div>
            </div>
          </div>

          {/* Right Interactive Form Panel */}
          <div className="md:col-span-7 p-lg sm:p-xl md:p-2xl bg-surface-raised flex flex-col justify-center">
            <PageHeader title={title} className="mb-xl" />
            {isLoading ? (
              <div className="space-y-md py-md" aria-busy="true">
                <SkeletonLoader height={44} variant="rectangular" aria-label="Checking your session" />
                <SkeletonLoader height={44} variant="rectangular" aria-label="Loading form" />
                <SkeletonLoader height={44} variant="rectangular" aria-label="Loading action" />
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
