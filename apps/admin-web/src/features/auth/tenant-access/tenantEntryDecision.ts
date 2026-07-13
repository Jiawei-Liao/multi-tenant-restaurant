import { APP_PATHS } from "../../../shared/routePaths.ts";
import type { AuthTenant, UserRole } from "../session/types";

const HOME_PATH_BY_ROLE: Record<UserRole, string> = {
  OWNER: APP_PATHS.adminHome,
  ADMIN: APP_PATHS.adminHome,
  STAFF: APP_PATHS.staffHome,
};

export function getTenantHomePath(tenant: Pick<AuthTenant, "role">) {
  return HOME_PATH_BY_ROLE[tenant.role];
}

export type TenantEntryDecision =
  | { kind: "home"; path: string }
  | { kind: "onboarding" }
  | { kind: "auto-select"; tenantId: string }
  | { kind: "choose" };

export function getTenantEntryDecision(
  currentTenant: AuthTenant | null,
  availableTenants: AuthTenant[],
  preferredTenantId: string | null,
): TenantEntryDecision {
  if (currentTenant) {
    return { kind: "home", path: getTenantHomePath(currentTenant) };
  }

  if (availableTenants.length === 0) {
    return { kind: "onboarding" };
  }

  const [onlyTenant] = availableTenants;

  if (availableTenants.length === 1 && onlyTenant) {
    return { kind: "auto-select", tenantId: onlyTenant.id };
  }

  if (
    preferredTenantId &&
    availableTenants.some((tenant) => tenant.id === preferredTenantId)
  ) {
    return { kind: "auto-select", tenantId: preferredTenantId };
  }

  return { kind: "choose" };
}
