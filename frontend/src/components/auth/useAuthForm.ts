import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import {
  AUTH_GENERIC_FAILURE,
  AUTH_SIGNUP_GENERIC_FAILURE,
} from "../../lib/errors";

export type AuthFieldName = "email" | "password" | "confirmPassword";

export interface AuthFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export type AuthFormErrors = Partial<Record<AuthFieldName, string>>;

export interface AuthFormActionParams {
  email: string;
  password: string;
}

export interface UseAuthFormOptions {
  mode: "signIn" | "signUp";
  /** Injected async action — `signIn("password", ...)` from useAuthActions(). */
  action: (params: AuthFormActionParams) => Promise<unknown>;
  /** Called only after the action resolves successfully. */
  onSuccess: () => void;
}

/** Practical email shape: something@something.tld. Server stays authoritative. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimum password length — matches the Password provider's server-side rule. */
export const MIN_PASSWORD_LENGTH = 8;

function validate(
  values: AuthFormValues,
  mode: "signIn" | "signUp",
): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const email = values.email.trim();
  if (email.length === 0) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.password.length === 0) {
    errors.password = "Enter your password.";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "Use at least 8 characters.";
  }

  if (mode === "signUp" && values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/**
 * Shared state machine for the sign-in and sign-up forms: values, inline
 * validation errors, submitting flag, and a single generic form-level error.
 *
 * Every failure thrown by the injected action is mapped to the generic
 * failure copy for the flow — raw provider error text is never surfaced
 * (TM-04). Submitted credentials are never logged.
 */
export function useAuthForm({ mode, action, onSuccess }: UseAuthFormOptions) {
  const [values, setValues] = useState<AuthFormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = useCallback((field: AuthFieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] === undefined ? current : { ...current, [field]: undefined },
    );
  }, []);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validation = validate(values, mode);
      setErrors(validation);
      const hasErrors = Object.values(validation).some(
        (message) => message !== undefined,
      );
      if (hasErrors) {
        return;
      }

      setFormError(null);
      setIsSubmitting(true);
      try {
        await action({ email: values.email.trim(), password: values.password });
        onSuccess();
      } catch {
        // TM-04: one generic string per flow — the caught value's message or
        // stack is never read or rendered.
        setFormError(
          mode === "signUp" ? AUTH_SIGNUP_GENERIC_FAILURE : AUTH_GENERIC_FAILURE,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, mode, action, onSuccess],
  );

  return { values, errors, isSubmitting, formError, setField, submit };
}
