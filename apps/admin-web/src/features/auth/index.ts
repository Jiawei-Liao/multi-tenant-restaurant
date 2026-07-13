export { AuthProvider } from "./session/AuthProvider";
export { useAuth } from "./session/authContext";

export { default as LoginPage } from "./login/LoginPage";
export { default as SignupPage } from "./signup/SignupPage";
export { default as TenantEntryRoute } from "./tenant-access/TenantEntryRoute";
export { default as SelectTenantPage } from "./tenant-access/SelectTenantPage";

export { default as RequireAuth } from "./guards/RequireAuth";
export { default as RequireAnonymous } from "./guards/RequireAnonymous";
export { default as RequireRole } from "./guards/RequireRole";

export {
  getTenantEntryDecision,
  getTenantHomePath,
} from "./tenant-access/tenantEntryDecision";

export type {
  AccountSignupInput,
  AuthTenant,
  AuthUser,
  UserRole,
} from "./session/types";
