import { ArrowLeft, Check } from "lucide-react";
import styles from "./SignupHeader.module.css";
import type { SignupStep } from "./types";

type SignupHeaderProps = {
  step: SignupStep;
  restaurantName: string;
  onBack: () => void;
};

const STEP_COPY: Record<
  SignupStep,
  { title: string; subtitle: (restaurantName: string) => string }
> = {
  restaurant: {
    title: "Tell us about your restaurant",
    subtitle: () => "This creates your workspace. You can invite staff later.",
  },
  account: {
    title: "Create your owner account",
    subtitle: (name) =>
      `You'll use this to log in and manage ${name.trim() || "your restaurant"}.`,
  },
};

function SignupHeader({ step, restaurantName, onBack }: SignupHeaderProps) {
  const { title, subtitle } = STEP_COPY[step];
  const isAccountStep = step === "account";

  return (
    <header className={styles.header}>
      {/* Step progress indicator */}
      <ol className={styles.steps} aria-label="Signup progress">
        <li className={isAccountStep ? styles.completeStep : styles.activeStep}>
          <span>{isAccountStep ? <Check aria-hidden="true" /> : "1"}</span>
          Restaurant
        </li>
        <li className={styles.stepDivider} aria-hidden="true" />
        <li className={isAccountStep ? styles.activeStep : ""}>
          <span>2</span>
          Your account
        </li>
      </ol>

      {/* Back button, only shown on account step */}
      {isAccountStep && (
        <button
          className={styles.backButton}
          type="button"
          onClick={onBack}
          aria-label="Back to restaurant details"
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </button>
      )}

      {/* Step title + subtitle */}
      <div className={styles.heading}>
        <h1>{title}</h1>
        <p>{subtitle(restaurantName)}</p>
      </div>
    </header>
  );
}

export default SignupHeader;
