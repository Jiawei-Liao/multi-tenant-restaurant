import { useEffect, useState } from "react";
import { toast } from "sonner";
import { initiateSignup, completeSignup, parseApiError } from "./api";
import { getToastMessage } from "./utils";
import { useRestaurantStep } from "./steps/RestaurantStep/useRestaurantStep";
import { useAccountStep } from "./steps/AccountStep/useAccountStep";
import { useNavigate } from "react-router-dom";
import type { SignupStep } from "./types";

export function useSignupForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignupStep>("restaurant");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSession, setSignupSession] = useState<{
    tenantId: string;
    iconUploadUrl: string | null;
  } | null>(null);

  const restaurant = useRestaurantStep();
  const account = useAccountStep();

  // Invalidate session if restaurant details or icon changes
  useEffect(() => {
    setSignupSession(null);
  }, [restaurant.restaurantName, restaurant.domain, restaurant.iconFile]);

  async function submitSignup() {
    if (!account.canSubmit) return;

    setIsSubmitting(true);

    try {
      let currentSession = signupSession;

      // Initiate signup session if we don't have one yet
      if (!currentSession) {
        const initiateResponse = await initiateSignup({
          domain: restaurant.domain,
          tenantName: restaurant.restaurantName.trim(),
          iconContentType: restaurant.iconFile?.type ?? null,
          iconSizeBytes: restaurant.iconFile?.size ?? null,
        });

        if (!initiateResponse.ok) {
          const error = await parseApiError(initiateResponse);

          if (error.code === "DOMAIN_TAKEN") {
            restaurant.markDomainTaken([]);
            setStep("restaurant");
            return;
          }

          toast.error(getToastMessage(error));
          return;
        }

        const sessionData = (await initiateResponse.json()) as {
          tenantId: string;
          iconUploadUrl: string | null;
        };

        setSignupSession(sessionData);
        currentSession = sessionData;
      }

      const { tenantId, iconUploadUrl } = currentSession;

      // Put file to presigned URL if present
      if (iconUploadUrl && restaurant.iconFile) {
        const uploadResponse = await fetch(iconUploadUrl, {
          method: "PUT",
          body: restaurant.iconFile,
          headers: {
            "Content-Type": restaurant.iconFile.type,
          },
        });

        if (!uploadResponse.ok) {
          setSignupSession(null);
          toast.error("Failed to upload restaurant icon.");
          return;
        }
      }

      // Complete signup
      const completeResponse = await completeSignup({
        tenantId,
        domain: restaurant.domain,
        tenantName: restaurant.restaurantName.trim(),
        ownerEmail: account.email.trim(),
        password: account.password,
      });

      if (!completeResponse.ok) {
        const error = await parseApiError(completeResponse);

        if (error.code === "DOMAIN_TAKEN") {
          setSignupSession(null);
          restaurant.markDomainTaken([]);
          setStep("restaurant");
          return;
        }

        toast.error(getToastMessage(error));
        return;
      }

      const signupData = (await completeResponse.json()) as {
        accessToken: string;
        refreshToken: string;
        tenantId: string;
        domain: string;
        tenantName: string;
        iconUrl: string | null;
      };

      console.log("signup completed, data:", signupData);

      setSignupSession(null);
      toast.success("Restaurant created.");

      setTimeout(() => {
        // TODO: Redirect to the dashboard page
        navigate("/");
      }, 500);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    step,
    setStep,
    restaurant,
    account,
    isSubmitting,
    submitSignup,
  };
}
