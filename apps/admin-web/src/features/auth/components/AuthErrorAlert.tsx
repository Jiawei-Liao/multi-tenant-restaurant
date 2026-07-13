import { X } from "lucide-react";
import styles from "./AuthErrorAlert.module.css";

type AuthErrorAlertProps = {
  message: string;
  onDismiss: () => void;
};

function AuthErrorAlert({ message, onDismiss }: AuthErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={styles.alert} role="alert">
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss error"
        onClick={onDismiss}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}

export default AuthErrorAlert;
