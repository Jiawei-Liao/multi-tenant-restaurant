import { useEffect, useRef, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { APP_PATHS } from "@/shared/routePaths";
import { useAuth } from "../session/authContext";
import type { AuthTenant } from "../session/types";
import {
  getTenantEntryDecision,
  getTenantHomePath,
} from "./tenantEntryDecision";
import { getLastTenantId } from "./tenantPreference";

function TenantEntryRoute() {
  const { user, currentTenant, availableTenants } = useAuth();

  if (!user) {
    return <Navigate to={APP_PATHS.login} replace />;
  }

  const decision = getTenantEntryDecision(
    currentTenant,
    availableTenants,
    getLastTenantId(user.id, availableTenants),
  );

  if (decision.kind === "home") {
    return <Navigate to={decision.path} replace />;
  }

  if (decision.kind === "onboarding") {
    return <Navigate to={APP_PATHS.onboarding} replace />;
  }

  if (decision.kind === "choose") {
    return <Navigate to={APP_PATHS.selectTenant} replace />;
  }

  return <TenantSelectionRedirect tenantId={decision.tenantId} />;
}

type TenantSelectionRedirectProps = {
  tenantId: string;
  onError?: () => void;
  pendingFallback?: ReactNode;
};

type SelectionAttempt = {
  tenantId: string;
  promise: Promise<AuthTenant>;
};

export function TenantSelectionRedirect({
  tenantId,
  onError,
  pendingFallback = null,
}: TenantSelectionRedirectProps) {
  const navigate = useNavigate();
  const { selectTenant } = useAuth();
  const attemptRef = useRef<SelectionAttempt | null>(null);

  useEffect(() => {
    let attempt = attemptRef.current;

    if (!attempt || attempt.tenantId !== tenantId) {
      attempt = {
        tenantId,
        promise: selectTenant(tenantId),
      };
      attemptRef.current = attempt;
    }

    let isSubscribed = true;

    void attempt.promise
      .then((tenant) => {
        if (isSubscribed) {
          navigate(getTenantHomePath(tenant), { replace: true });
        }
      })
      .catch(() => {
        if (!isSubscribed) {
          return;
        }

        toast.error("Could not open that restaurant.");

        if (onError) {
          onError();
        } else {
          navigate(APP_PATHS.selectTenant, {
            replace: true,
            state: { failedAutomaticTenantId: tenantId },
          });
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [navigate, onError, selectTenant, tenantId]);

  return <>{pendingFallback}</>;
}

export default TenantEntryRoute;
