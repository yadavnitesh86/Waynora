import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuthForm } from "./useAuthForm";
import PasswordField from "./PasswordField";
import { Button, ErrorText, TextField } from "../ui";

/**
 * Email + password + confirm-password sign-up form (UI-SPEC `/signup`
 * surface). Client-side minimum of 8 characters; 10 recommended. Password
 * reset and email verification are deliberately absent (CONTEXT D-11).
 */
export default function SignUpForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

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
        autoComplete="new-password"
        error={errors.password}
        hint={
          <>
            <p>At least 8 characters.</p>
            <p>We recommend 10 characters or more.</p>
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

      {formError === null ? null : <ErrorText>{formError}</ErrorText>}

      <Button type="submit" isSubmitting={isSubmitting}>
        Create account
      </Button>

      {signedIn && (
        <p role="status" aria-live="polite" className="text-small text-success">
          Signed in.
        </p>
      )}
    </form>
  );
}
