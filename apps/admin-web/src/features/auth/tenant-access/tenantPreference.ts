import type { AuthTenant } from "../session/types";

const LAST_TENANT_KEY_PREFIX = "admin:lastTenantId:";

export function getLastTenantId(userId: string, tenants: AuthTenant[]) {
  try {
    const tenantId = window.localStorage.getItem(lastTenantKey(userId));
    return tenantId && tenants.some((tenant) => tenant.id === tenantId)
      ? tenantId
      : null;
  } catch {
    return null;
  }
}

export function setLastTenantId(userId: string, tenantId: string) {
  try {
    window.localStorage.setItem(lastTenantKey(userId), tenantId);
  } catch {
    // Local storage is only a preference. Ignore unavailable storage.
  }
}

function lastTenantKey(userId: string) {
  return `${LAST_TENANT_KEY_PREFIX}${userId}`;
}
