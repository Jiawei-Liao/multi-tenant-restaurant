import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthStatusScreen from "../components/AuthStatusScreen";
import { useAuth } from "../session/authContext";
import { APP_PATHS } from "@/shared/routePaths";

type RequireAuthProps = {
  requireTenant?: boolean;
};

function RequireAuth({ requireTenant = false }: RequireAuthProps) {
  const { status, user, currentTenant, retry } = useAuth();
  const location = useLocation();

  if (status === "loading" || status === "error") {
    return <AuthStatusScreen status={status} onRetry={retry} />;
  }

  if (!user) {
    return <Navigate to={APP_PATHS.login} replace state={{ from: location }} />;
  }

  if (requireTenant && !currentTenant) {
    return <Navigate to={APP_PATHS.app} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
