import { ArrowRight, Utensils } from "lucide-react";
import styles from "./Home.module.css";
import { Link } from "react-router-dom";

function Home() {
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
          <Link className={`${styles.action} ${styles.signup}`} to="/signup">
            <span>
              <span className={styles.actionTitle}>Get started</span>
              <span className={styles.actionText}>
                Set up your locations, menu, and team
              </span>
            </span>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
          </Link>

          <Link className={styles.action} to="/login">
            <span>
              <span className={styles.actionTitle}>Log in</span>
              <span className={styles.actionText}>Back to your dashboard</span>
            </span>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
          </Link>
        </nav>
      </section>
    </main>
  );
}

export default Home;
