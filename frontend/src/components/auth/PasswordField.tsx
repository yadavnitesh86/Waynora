import { useId, useState } from "react";
import type { ReactNode } from "react";

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: ReactNode;
}

const INPUT_BASE =
  "w-full min-h-[44px] px-md py-sm pr-3xl border rounded-md bg-surface-raised text-ink";

/**
 * Controlled password input with a show/hide toggle (accessibility contract
 * FOUND-05): `aria-pressed` on the toggle and an `aria-label` that flips
 * between "Show password" and "Hide password".
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint !== undefined ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-ink mb-2xs">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${INPUT_BASE} ${error ? "border-danger" : "border-line"}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 min-h-[44px] px-sm text-small font-medium text-accent underline underline-offset-2 hover:text-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint !== undefined && (
        <div id={hintId} className="mt-2xs">
          {hint}
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-small text-danger mt-2xs">
          {error}
        </p>
      )}
    </div>
  );
}
