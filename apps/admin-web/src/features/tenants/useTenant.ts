import { useAuth } from "@/features/auth";

export function useTenant() {
  const { currentTenant: tenant, availableTenants: tenants } = useAuth();

  if (!tenant) {
    throw new Error("useTenant must be used with a selected tenant session");
  }

  return {
    tenant,
    tenants,
  };
}
