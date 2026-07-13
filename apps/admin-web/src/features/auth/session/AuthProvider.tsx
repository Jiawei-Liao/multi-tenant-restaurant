import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AuthContext, type AuthContextValue } from "./authContext";
import { authCoordinator } from "./authCoordinator";
import { INITIAL_AUTH_STATE } from "./authState";

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    authCoordinator.subscribe,
    authCoordinator.getSnapshot,
    () => INITIAL_AUTH_STATE,
  );

  useEffect(() => authCoordinator.start(), []);

  const session = state.status === "authenticated" ? state.session : null;
  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: session?.user ?? null,
      currentTenant: session?.tenant ?? null,
      availableTenants: session?.tenants ?? [],
      currentRole: session?.tenant?.role ?? null,
      error: state.error,
      login: authCoordinator.login,
      signup: authCoordinator.signup,
      retry: authCoordinator.retry,
      selectTenant: authCoordinator.selectTenant,
      logout: authCoordinator.logout,
    }),
    [session, state.error, state.status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
