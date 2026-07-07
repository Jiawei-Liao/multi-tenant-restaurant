import { Link } from "react-router-dom";
import SignupHeader from "./SignupHeader";
import RestaurantStep from "./steps/RestaurantStep/RestaurantStep";
import AccountStep from "./steps/AccountStep/AccountStep";
import { useSignupForm } from "./useSignupForm";
import styles from "./Signup.module.css";

function Signup() {
  const { step, setStep, restaurant, account, isSubmitting, submitSignup } =
    useSignupForm();

  return (
    <main className={styles.page}>
      <form className={styles.panel} onSubmit={(e) => e.preventDefault()}>
        <SignupHeader
          step={step}
          restaurantName={restaurant.restaurantName}
          onBack={() => setStep("restaurant")}
        />

        {step === "restaurant" ? (
          <RestaurantStep
            form={restaurant}
            canContinue={restaurant.canContinue}
            onContinue={() => setStep("account")}
          />
        ) : (
          <AccountStep
            form={account}
            isSubmitting={isSubmitting}
            onSubmit={submitSignup}
          />
        )}

        <p className={styles.loginText}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}

export default Signup;
