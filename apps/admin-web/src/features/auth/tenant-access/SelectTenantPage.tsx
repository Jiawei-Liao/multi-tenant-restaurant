import { useCallback, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTenantSelection } from "@/features/tenants";
import { APP_PATHS } from "@/shared/routePaths";
import { useAuth } from "../session/authContext";
import { TenantSelectionRedirect } from "./TenantEntryRoute";
import { getTenantEntryDecision } from "./tenantEntryDecision";
import { getLastTenantId } from "./tenantPreference";
import styles from "./SelectTenantPage.module.css";

type SelectTenantLocationState = {
  failedAutomaticTenantId?: string;
};

function SelectTenantPage() {
  const location = useLocation();
  const { user, currentTenant, availableTenants: tenants } = useAuth();
  const locationState = (location.state ?? {}) as SelectTenantLocationState;
  const [failedAutomaticTenantId, setFailedAutomaticTenantId] = useState<
    string | null
  >(locationState.failedAutomaticTenantId ?? null);
  const preferredTenantId = user ? getLastTenantId(user.id, tenants) : null;
  const entryDecision = user
    ? getTenantEntryDecision(currentTenant, tenants, preferredTenantId)
    : null;
  const automaticTenantId =
    !currentTenant && entryDecision?.kind === "auto-select"
      ? entryDecision.tenantId
      : null;

  const handleAutomaticSelectionError = useCallback(() => {
    if (automaticTenantId) {
      setFailedAutomaticTenantId(automaticTenantId);
    }
  }, [automaticTenantId]);
  const { openTenant, isSelecting } = useTenantSelection({
    onSelectionError: setFailedAutomaticTenantId,
  });

  if (!user) {
    return <Navigate to={APP_PATHS.login} replace />;
  }

  if (!currentTenant && entryDecision?.kind === "onboarding") {
    return <Navigate to={APP_PATHS.onboarding} replace />;
  }

  if (automaticTenantId && failedAutomaticTenantId !== automaticTenantId) {
    return (
      <TenantSelectionRedirect
        tenantId={automaticTenantId}
        pendingFallback={<p role="status">Opening your restaurant…</p>}
        onError={handleAutomaticSelectionError}
      />
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel} aria-labelledby="select-tenant-title">
        <div className={styles.heading}>
          <h1 id="select-tenant-title">Choose restaurant</h1>
          <p>Select the restaurant you want to manage.</p>
        </div>

        <div className={styles.list}>
          {tenants.map((tenant) => {
            const initial = tenant.name.trim().charAt(0).toUpperCase() || "R";
            const isCurrentTenant = tenant.id === currentTenant?.id;

            return (
              <button
                aria-current={isCurrentTenant ? "true" : undefined}
                className={styles.tenantButton}
                disabled={isSelecting}
                key={tenant.id}
                type="button"
                onClick={() => void openTenant(tenant.id)}
              >
                {tenant.iconUrl ? (
                  <img className={styles.icon} src={tenant.iconUrl} alt="" />
                ) : (
                  <span className={styles.iconFallback} aria-hidden="true">
                    {initial}
                  </span>
                )}

                <span>
                  <span className={styles.name}>{tenant.name}</span>
                  <span className={styles.subdomain}>
                    {tenant.subdomain}
                    {isCurrentTenant ? " · Current" : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default SelectTenantPage;
