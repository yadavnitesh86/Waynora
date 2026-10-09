import { useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuthForm } from "./useAuthForm";
import PasswordField from "./PasswordField";
import { isValidNextPath } from "../../routes/ProtectedRoute";

const EMAIL_INPUT =
  "w-full min-h-[44px] px-md py-sm border rounded-md bg-surface-raised text-ink";

/**
 * Email + password sign-in form (UI-SPEC `/signin` surface).
 * On success it navigates to the allowlisted `next` target or `/chat`.
 */
export default function SignInForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [signedIn, setSignedIn] = useState(false);
  const emailId = useId();
  const emailErrorId = `${emailId}-error`;

  const { values, errors, isSubmitting, formError, setField, submit } =
    useAuthForm({
      mode: "signIn",
      action: ({ email, password }) =>
        signIn("password", { email, password, flow: "signIn" }),
      onSuccess: () => {
        setSignedIn(true);
        const requested = searchParams.get("next");
        const target =
          requested !== null && isValidNextPath(requested) ? requested : "/chat";
        navigate(target, { replace: true });
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
        autoComplete="current-password"
        error={errors.password}
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
        Sign in
      </button>

      {signedIn && (
        <p role="status" aria-live="polite" className="text-small text-success">
          Signed in.
        </p>
      )}
    </form>
  );
}
