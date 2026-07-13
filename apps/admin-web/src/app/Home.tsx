import { ArrowRight, Utensils } from "lucide-react";
import styles from "./Home.module.css";
import { Link } from "react-router-dom";
import { APP_NAME } from "@/shared/branding";
import { APP_PATHS } from "@/shared/routePaths";

function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="home-title">
        <span className={styles.logo} aria-hidden="true">
          <Utensils className={styles.icon} />
        </span>

        <div className={styles.heading}>
          <h1 id="home-title">{APP_NAME}</h1>
          <p>Manage locations, staff, and menus in one place.</p>
        </div>

        <nav className={styles.actions} aria-label="Account">
          <Link
            className={`${styles.action} ${styles.signup}`}
            to={APP_PATHS.signup}
          >
            <span>
              <h2>Sign up</h2>
              <p>Create your account</p>
            </span>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
          </Link>

          <Link className={styles.action} to={APP_PATHS.login}>
            <span>
              <h2>Log in</h2>
              <p>Back to your restaurant</p>
            </span>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
          </Link>
        </nav>
      </section>
    </main>
  );
}

export default Home;
