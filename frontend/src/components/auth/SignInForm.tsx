import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuthForm } from "./useAuthForm";
import PasswordField from "./PasswordField";
import { isValidNextPath } from "../../routes/ProtectedRoute";
import { Button, ErrorText, TextField } from "../ui";

/**
 * Email + password sign-in form (UI-SPEC `/signin` surface).
 * On success it navigates to the allowlisted `next` target or `/chat`.
 */
export default function SignInForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [signedIn, setSignedIn] = useState(false);

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
      <TextField
        label="Email address"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(event) => setField("email", event.target.value)}
        error={errors.email}
        placeholder="you@example.com"
      />

      <PasswordField
        label="Password"
        value={values.password}
        onChange={(value) => setField("password", value)}
        autoComplete="current-password"
        error={errors.password}
      />

      {formError === null ? null : <ErrorText>{formError}</ErrorText>}

      <Button type="submit" isSubmitting={isSubmitting}>
        Sign in
      </Button>

      {signedIn && (
        <p role="status" aria-live="polite" className="text-small text-success">
          Signed in.
        </p>
      )}
    </form>
  );
}
