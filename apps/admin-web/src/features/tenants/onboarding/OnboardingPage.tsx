import { Plus, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { APP_PATHS } from "@/shared/routePaths";
import styles from "./OnboardingPage.module.css";

function OnboardingPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <section className={styles.content} aria-labelledby="onboarding-title">
        <span className={styles.logo} aria-hidden="true">
          <Utensils className={styles.logoIcon} />
        </span>

        <div className={styles.heading}>
          <h1 id="onboarding-title">Welcome, {user.firstName}</h1>
          <p>Create a restaurant to get started.</p>
        </div>

        <Link className={styles.createButton} to={APP_PATHS.createRestaurant}>
          <Plus className={styles.createIcon} aria-hidden="true" />
          Create Restaurant
        </Link>
      </section>
    </div>
  );
}

export default OnboardingPage;
