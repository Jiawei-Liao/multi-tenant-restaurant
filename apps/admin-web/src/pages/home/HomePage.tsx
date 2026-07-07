import { ArrowRight, Utensils } from "lucide-react";
import styles from "./HomePage.module.css";

function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="home-title">
        <span className={styles.logo} aria-hidden="true">
          <Utensils className={styles.logoIcon} />
        </span>

        <div className={styles.heading}>
          <h1 id="home-title">Restaurant Manager</h1>
          <p>Manage locations, staff, and menus in one place.</p>
        </div>

        <nav className={styles.actions} aria-label="Account">
          <a className={`${styles.action} ${styles.signup}`} href="/signup">
            <span>
              <span className={styles.actionTitle}>Get started</span>
              <span className={styles.actionText}>
                Set up your locations, menu, and team
              </span>
            </span>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
          </a>

          <a className={styles.action} href="/login">
            <span>
              <span className={styles.actionTitle}>Log in</span>
              <span className={styles.actionText}>Back to your dashboard</span>
            </span>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
          </a>
        </nav>
      </section>
    </main>
  );
}

export default HomePage;
