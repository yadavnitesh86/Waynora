import { useState } from "react";
import type { ReactNode } from "react";
import { TextField } from "../ui";

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: ReactNode;
}

/**
 * Controlled password input with a show/hide toggle (accessibility contract
 * FOUND-05): `aria-pressed` on the toggle and an `aria-label` that flips
 * between "Show password" and "Hide password".
 *
 * Label, hint, error, and `aria-describedby` wiring all come from the
 * `TextField` primitive — this component only owns the visibility toggle.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      error={error}
      hint={hint}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="min-h-[44px] px-sm text-small font-medium text-accent underline underline-offset-2 hover:text-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
