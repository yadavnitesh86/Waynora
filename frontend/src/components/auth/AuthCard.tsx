import type { ReactNode } from "react";
import { PageHeader } from "../ui";
import SkeletonLoader from "../ui/SkeletonLoader";

export interface AuthCardProps {
  title: string;
  children?: ReactNode;
}

/**
 * Shared auth card shell (Option A — Split panel per 05-UI-SPEC Surface 3).
 *
 * Desktop:
 * - Left panel (40%, `--color-surface-dark`): Waynora wordmark + brand logo + editorial tagline
 * - Right panel (60%, `--color-surface`): centered auth form
 * Mobile:
 * - Stacks vertically; dark panel becomes a slim brand bar at top
 *
 * Protected route session check renders a clean skeleton loader inside when children are absent.
 */
export default function AuthCard({ title, children }: AuthCardProps) {
  const isLoading = children === undefined;

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-md py-xl md:py-3xl">
      <div className="w-full max-w-[56rem] overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-md grid grid-cols-1 md:grid-cols-12 transition-all">
        {/* Left Editorial Brand Panel */}
        <div className="md:col-span-5 bg-surface-dark text-ink-inverse p-lg md:p-xl flex flex-col justify-between border-b md:border-b-0 md:border-r border-line/20">
          <div className="flex items-center gap-sm">
            <img
              src="/logo.png"
              alt="Waynora Logo"
              className="h-8 w-8 object-contain rounded-md"
            />
            <span className="font-display text-h3 font-semibold text-ink-inverse tracking-tight">
              Waynora
            </span>
          </div>

          <div className="my-lg hidden md:block">
            <p className="text-overline font-semibold uppercase tracking-[0.16em] text-accent-soft/80">
              Specialist Intelligence
            </p>
            <p className="mt-xs font-display text-lead font-medium text-ink-inverse leading-snug">
              Travel itineraries crafted by coordinated specialists, not generic single-shot prompts.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-xs text-caption text-ink-inverse-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Honest planning • 5–15 min generation</span>
          </div>
        </div>

        {/* Right Interactive Form Panel */}
        <div className="md:col-span-7 p-lg sm:p-xl md:p-2xl bg-surface flex flex-col justify-center">
          <PageHeader title={title} className="mb-lg" />
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
  );
}
