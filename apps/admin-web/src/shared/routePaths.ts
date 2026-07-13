export const APP_PATHS = {
  home: "/",
  login: "/login",
  signup: "/signup",
  app: "/app",
  onboarding: "/onboarding",
  selectTenant: "/select-tenant",
  settings: "/settings",
  adminHome: "/admin",
  adminMenu: "/admin/menu",
  adminLocations: "/admin/locations",
  adminStaff: "/admin/staff",
  adminRestaurant: "/admin/restaurant",
  staffHome: "/staff",
  staffOrders: "/staff/orders",
} as const;

export function isTenantWorkspacePath(pathname: string) {
  return (
    pathname === APP_PATHS.adminHome ||
    pathname.startsWith(`${APP_PATHS.adminHome}/`) ||
    pathname === APP_PATHS.staffHome ||
    pathname.startsWith(`${APP_PATHS.staffHome}/`)
  );
}
