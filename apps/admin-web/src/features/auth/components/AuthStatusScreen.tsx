import { CloudOff, RotateCcw } from "lucide-react";
import { Button } from "@multi-tenant-restaurant/ui";
import LoadingAnimation from "@/components/LoadingAnimation";
import styles from "./AuthStatusScreen.module.css";

type AuthStatusScreenProps = {
  status: "loading" | "error";
  onRetry: () => Promise<void>;
};

function AuthStatusScreen({ status, onRetry }: AuthStatusScreenProps) {
  if (status === "loading") {
    return (
      <main className={styles.screen}>
        <LoadingAnimation />
      </main>
    );
  }

  return (
    <main className={styles.screen}>
      <section
        className={styles.errorContent}
        role="alert"
        aria-labelledby="session-error-title"
      >
        <CloudOff className={styles.errorIcon} aria-hidden="true" />
        <h1 id="session-error-title" className={styles.errorTitle}>
          Couldn&apos;t load this content
        </h1>
        <p className={styles.errorMessage}>
          Your connection to the server was interrupted.
        </p>
        <Button
          className={styles.retryButton}
          type="button"
          variant="outline"
          size="lg"
          onClick={() => void onRetry().catch(() => undefined)}
        >
          <RotateCcw aria-hidden="true" />
          Retry
        </Button>
      </section>
    </main>
  );
}

export default AuthStatusScreen;
