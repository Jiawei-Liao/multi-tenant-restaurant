import { Input } from "@multi-tenant-restaurant/ui";
import PasswordInput from "../../PasswordInput";
import { AsyncButton } from "@/components/AsyncButton";
import signup from "../../Signup.module.css";
import type { useAccountStep } from "./useAccountStep";

type AccountStepProps = {
  form: ReturnType<typeof useAccountStep>;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
};

function AccountStep({ form, isSubmitting, onSubmit }: AccountStepProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    canSubmit,
  } = form;

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword
      ? "Passwords do not match."
      : "";

  return (
    <section aria-labelledby="account-step-title">
      <div className={signup.fields}>
        <label className={signup.field}>
          <span>Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event: any) => setEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </label>

        <label className={signup.field}>
          <span>Password</span>
          <PasswordInput
            id="password"
            value={password}
            show={showPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            onChange={setPassword}
            onToggle={() => setShowPassword((c) => !c)}
          />
        </label>

        <label className={signup.field}>
          <span>Confirm password</span>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            show={showConfirmPassword}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={passwordMismatch}
            onChange={setConfirmPassword}
            onToggle={() => setShowConfirmPassword((c) => !c)}
          />
        </label>
      </div>

      <AsyncButton
        mode="oneshot"
        className={signup.primaryButton}
        isDisabled={!canSubmit || isSubmitting}
        idleText="Create restaurant"
        loadingText="Creating..."
        slowText="Still working on it..."
        completedText="Done!"
        slowThresholdMs={2000}
        onClick={onSubmit}
      />
    </section>
  );
}

export default AccountStep;
