import { Link } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import SignInForm from "../components/auth/SignInForm";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function SignIn() {
  useDocumentTitle("Sign in", "Sign in to Waynora");

  return (
    <AuthCard title="Welcome back">
      <SignInForm />
      <p className="text-small text-ink-muted mt-lg text-center">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="text-accent underline underline-offset-2 hover:text-ink"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
