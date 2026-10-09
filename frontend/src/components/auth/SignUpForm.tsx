import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuthForm } from "./useAuthForm";
import PasswordField from "./PasswordField";

const EMAIL_INPUT =
  "w-full min-h-[44px] px-md py-sm border rounded-md bg-surface-raised text-ink";

/**
 * Email + password + confirm-password sign-up form (UI-SPEC `/signup`
 * surface). Client-side minimum of 8 characters; 10 recommended. Password
 * reset and email verification are deliberately absent (CONTEXT D-11).
 */
export default function SignUpForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const emailId = useId();
  const emailErrorId = `${emailId}-error`;

  const { values, errors, isSubmitting, formError, setField, submit } =
    useAuthForm({
      mode: "signUp",
      action: ({ email, password }) =>
        signIn("password", { email, password, flow: "signUp" }),
      onSuccess: () => {
        setSignedIn(true);
        navigate("/chat", { replace: true });
      },
    });

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={isSubmitting}
      className="flex flex-col gap-md"
    >
      <div>
        <label
          htmlFor={emailId}
          className="block text-small font-medium text-ink mb-2xs"
        >
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setField("email", event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? emailErrorId : undefined}
          placeholder="you@example.com"
          className={`${EMAIL_INPUT} ${errors.email ? "border-danger" : "border-line"}`}
        />
        {errors.email && (
          <p id={emailErrorId} role="alert" className="text-small text-danger mt-2xs">
            {errors.email}
          </p>
        )}
      </div>

      <PasswordField
        label="Password"
        value={values.password}
        onChange={(value) => setField("password", value)}
        autoComplete="new-password"
        error={errors.password}
        hint={
          <>
            <p className="text-caption text-ink-muted">At least 8 characters.</p>
            <p className="text-caption text-ink-muted">
              We recommend 10 characters or more.
            </p>
          </>
        }
      />

      <PasswordField
        label="Confirm password"
        value={values.confirmPassword}
        onChange={(value) => setField("confirmPassword", value)}
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      {formError && (
        <p role="alert" className="text-small text-danger">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="min-h-[44px] px-lg py-sm bg-accent text-accent-ink font-semibold rounded-md shadow-sm hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Create account
      </button>

      {signedIn && (
        <p role="status" aria-live="polite" className="text-small text-success">
          Signed in.
        </p>
      )}
    </form>
  );
}
