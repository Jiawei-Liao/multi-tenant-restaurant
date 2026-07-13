import { createContext, useContext } from "react";
import type {
  AccountSignupInput,
  AuthTenant,
  AuthUser,
  UserRole,
} from "./types";
import type { AuthState } from "./authState";

export type AuthContextValue = {
  status: AuthState["status"];
  user: AuthUser | null;
  currentTenant: AuthTenant | null;
  availableTenants: AuthTenant[];
  currentRole: UserRole | null;
  error: Error | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  signup: (input: AccountSignupInput) => Promise<void>;
  retry: () => Promise<void>;
  selectTenant: (tenantId: string) => Promise<AuthTenant>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
