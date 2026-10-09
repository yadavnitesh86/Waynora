import type { ReactNode } from "react";

export interface AuthCardProps {
  title: string;
  children?: ReactNode;
}

/**
 * Shared auth card shell (UI-SPEC "Auth card wrapper" surface): raised
 * surface, `lg` radius, hairline border, `focus-within` ring, serif `<h1>`.
 *
 * Deliberately owns no `<form>` — sign-in/sign-up render their own
 * `noValidate` form as children, and the protected-route loading state
 * reuses this shell with plain content instead of a form.
 */
export default function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-md py-3xl">
      <div className="w-full max-w-[28rem] bg-surface rounded-lg shadow-sm border border-line p-xl focus-within:ring-2 focus-within:ring-focus">
        <h1 className="font-display text-h1 font-semibold text-ink mb-lg text-balance">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
