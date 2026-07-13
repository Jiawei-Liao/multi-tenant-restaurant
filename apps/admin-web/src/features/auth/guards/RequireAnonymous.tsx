import { Navigate, Outlet } from "react-router-dom";
import AuthStatusScreen from "../components/AuthStatusScreen";
import { useAuth } from "../session/authContext";
import { APP_PATHS } from "@/shared/routePaths";

function RequireAnonymous() {
  const { status, user, retry } = useAuth();

  if (status === "loading" || status === "error") {
    return <AuthStatusScreen status={status} onRetry={retry} />;
  }

  if (user) {
    return <Navigate to={APP_PATHS.app} replace />;
  }

  return <Outlet />;
}

export default RequireAnonymous;
