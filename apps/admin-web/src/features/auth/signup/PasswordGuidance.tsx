import { Check, X } from "lucide-react";
import styles from "./PasswordGuidance.module.css";

type PasswordChecks = {
  minLength: boolean;
  number: boolean;
  symbol: boolean;
  mixedCase: boolean;
};

function PasswordGuidance({ checks }: { checks: PasswordChecks }) {
  const recommendedRows = [
    { label: "Number", met: checks.number },
    { label: "Symbol", met: checks.symbol },
    { label: "Upper and lowercase", met: checks.mixedCase },
  ];

  return (
    <div
      className={styles.guidance}
      id="signup-password-guidance"
      aria-label="Password guidance"
    >
      <PasswordGuidanceRequirement
        label="At least 8 characters"
        met={checks.minLength}
      />

      <div className={styles.recommendations}>
        {recommendedRows.map(({ label, met }) => {
          const Icon = met ? Check : X;

          return (
            <div className={styles.recommendation} data-met={met} key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PasswordGuidanceRequirement({
  label,
  met,
}: {
  label: string;
  met: boolean;
}) {
  const Icon = met ? Check : X;

  return (
    <div className={styles.requirement} data-met={met}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default PasswordGuidance;
