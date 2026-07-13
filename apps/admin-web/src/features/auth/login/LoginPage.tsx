import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@multi-tenant-restaurant/ui";
import { APP_PATHS } from "@/shared/routePaths";
import { ApiClientError } from "../session/authTransport";
import { useAuth } from "../session/authContext";
import { validateEmail } from "../components/authValidation";
import AuthErrorAlert from "../components/AuthErrorAlert";
import PasswordInput from "../components/PasswordInput";
import styles from "../components/AuthPage.module.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const emailError = validateEmail(email);

    if (emailError) {
      setError(emailError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });
      navigate(APP_PATHS.app, { replace: true });
    } catch (caughtError) {
      setError(getLoginErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="login-title">
        <div className={styles.heading}>
          <h1 id="login-title">Log in</h1>
          <p>Continue to your restaurant home.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <AuthErrorAlert message={error} onDismiss={() => setError("")} />

          <label>
            Email
            <Input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              required
              value={password}
              onChange={setPassword}
            />
          </label>

          <Button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting || !email.trim() || !password}
          >
            {isSubmitting ? "Logging in" : "Log in"}
          </Button>
        </form>

        <p className={styles.footerText}>
          Don&apos;t have an account? <Link to={APP_PATHS.signup}>Sign up</Link>
        </p>
      </section>
    </main>
  );
}

function getLoginErrorMessage(error: unknown) {
  if (
    error instanceof ApiClientError &&
    (error.code === "INVALID_CREDENTIALS" || error.status === 401)
  ) {
    return "Invalid email or password.";
  }

  if (error instanceof ApiClientError && error.code === "VALIDATION_ERROR") {
    return "Enter a valid email address and password.";
  }

  return "Could not log in. Check your connection and try again.";
}

export default LoginPage;
