import { Link } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import SignUpForm from "../components/auth/SignUpForm";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function SignUp() {
  useDocumentTitle("Create account", "Create your Waynora account");

  return (
    <AuthCard title="Create your account">
      <SignUpForm />
      <p className="text-small text-ink-muted mt-lg text-center">
        Already have an account?{" "}
        <Link
          to="/signin"
          className="text-accent underline underline-offset-2 hover:text-ink"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
