import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@multi-tenant-restaurant/ui";
import { toast } from "sonner";
import { APP_PATHS } from "@/shared/routePaths";
import { ApiClientError } from "../session/authTransport";
import { useAuth } from "../session/authContext";
import AuthErrorAlert from "../components/AuthErrorAlert";
import PasswordGuidance from "./PasswordGuidance";
import PasswordInput from "../components/PasswordInput";
import {
  validateEmail,
  validateFirstName,
  validatePassword,
} from "../components/authValidation";
import styles from "../components/AuthPage.module.css";

type TouchedField = "firstName" | "email" | "password";

const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<TouchedField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<TouchedField, boolean>>({
    firstName: false,
    email: false,
    password: false,
  });

  const passwordChecks = {
    minLength: password.length >= 8,
    number: /\d/.test(password),
    symbol: SYMBOL_PATTERN.test(password),
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };

  const validationErrors = {
    firstName: validateFirstName(firstName),
    email: validateEmail(email),
    password: validatePassword(password),
  };
  const firstNameError =
    touched.firstName && focusedField !== "firstName"
      ? validationErrors.firstName
      : undefined;
  const emailError =
    touched.email && focusedField !== "email"
      ? validationErrors.email
      : undefined;
  const passwordError =
    touched.password && focusedField !== "password"
      ? validationErrors.password
      : undefined;
  const isPasswordGuidanceVisible =
    isPasswordFocused || password.length > 0 || !!passwordError;
  const isFormValid = Object.values(validationErrors).every(
    (fieldError) => fieldError === undefined,
  );

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isFormValid) {
      setTouched({
        firstName: true,
        email: true,
        password: true,
      });
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim(),
        password,
      });
      toast.success("Account created.");
      navigate(APP_PATHS.app, { replace: true });
    } catch (caughtError) {
      setError(getSignupErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function touchField(field: TouchedField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="signup-title">
        <div className={styles.heading}>
          <h1 id="signup-title">Sign up</h1>
          <p>Create your account, then set up or join a restaurant.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <AuthErrorAlert message={error} onDismiss={() => setError("")} />

          <div className={styles.nameRow}>
            <label>
              <span>
                First name <span className={styles.required}>*</span>
              </span>
              <Input
                aria-describedby={
                  firstNameError ? "first-name-error" : undefined
                }
                aria-invalid={!!firstNameError}
                aria-required="true"
                autoComplete="given-name"
                maxLength={100}
                value={firstName}
                onBlur={() => {
                  setFocusedField(null);
                  touchField("firstName");
                }}
                onChange={(event) => setFirstName(event.target.value)}
                onFocus={() => setFocusedField("firstName")}
              />
              {firstNameError && (
                <span
                  className={styles.fieldError}
                  id="first-name-error"
                  role="alert"
                >
                  {firstNameError}
                </span>
              )}
            </label>

            <label>
              <span>
                Last name <span className={styles.optional}>(optional)</span>
              </span>
              <Input
                autoComplete="family-name"
                maxLength={100}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>
              Email <span className={styles.required}>*</span>
            </span>
            <Input
              aria-describedby={emailError ? "email-error" : undefined}
              aria-invalid={!!emailError}
              aria-required="true"
              autoComplete="email"
              type="email"
              value={email}
              onBlur={() => {
                setFocusedField(null);
                touchField("email");
              }}
              onChange={(event) => setEmail(event.target.value)}
              onFocus={() => setFocusedField("email")}
            />
            {emailError && (
              <span className={styles.fieldError} id="email-error" role="alert">
                {emailError}
              </span>
            )}
          </label>

          <label>
            <span>
              Password <span className={styles.required}>*</span>
            </span>
            <PasswordInput
              id="signup-password"
              ariaDescribedBy={
                isPasswordGuidanceVisible
                  ? "signup-password-guidance"
                  : undefined
              }
              autoComplete="new-password"
              error={passwordError}
              placeholder="At least 8 characters"
              showErrorMessage={false}
              value={password}
              onBlur={() => {
                setFocusedField(null);
                setIsPasswordFocused(false);
                touchField("password");
              }}
              onChange={setPassword}
              onFocus={() => {
                setFocusedField("password");
                setIsPasswordFocused(true);
              }}
            />
          </label>

          {isPasswordGuidanceVisible && (
            <PasswordGuidance checks={passwordChecks} />
          )}

          <Button
            className={styles.submitButton}
            type="submit"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Creating account" : "Create account"}
          </Button>
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link to={APP_PATHS.login}>Log in</Link>
        </p>
      </section>
    </main>
  );
}

function getSignupErrorMessage(error: unknown) {
  if (
    error instanceof ApiClientError &&
    error.code === "EMAIL_ALREADY_REGISTERED"
  ) {
    return "That email already has an account.";
  }

  if (error instanceof ApiClientError && error.code === "VALIDATION_ERROR") {
    return "Check the form and try again.";
  }

  return "Could not create account. Try again.";
}

export default SignupPage;
