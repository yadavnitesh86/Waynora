import type { ReactNode } from "react";
import { PageHeader } from "../ui";

export interface AuthCardProps {
  title: string;
  children?: ReactNode;
}

/**
 * Shared auth card shell (UI-SPEC "Auth card wrapper" surface): raised
 * surface, `lg` radius, hairline border, `focus-within` ring, serif `<h1>`.
 *
 * The heading is rendered through the `PageHeader` primitive so heading
 * typography lives in exactly one place.
 *
 * Deliberately owns no `<form>` — sign-in/sign-up render their own
 * `noValidate` form as children, and the protected-route loading state
 * reuses this shell with plain content instead of a form.
 */
export default function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-md py-3xl">
      <div className="w-full max-w-[28rem] bg-surface rounded-lg shadow-sm border border-line p-xl focus-within:ring-2 focus-within:ring-focus">
        <PageHeader title={title} className="mb-lg" />
        {children}
      </div>
    </div>
  );
}
