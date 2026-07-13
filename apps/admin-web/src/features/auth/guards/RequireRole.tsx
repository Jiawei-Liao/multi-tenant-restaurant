import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { APP_PATHS } from "@/shared/routePaths";
import { getTenantHomePath } from "../tenant-access/tenantEntryDecision";
import { useAuth } from "../session/authContext";
import type { UserRole } from "../session/types";

type RequireRoleProps = {
  allowedRoles: readonly UserRole[];
  children?: ReactNode;
};

function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { currentTenant: tenant } = useAuth();

  if (!tenant) {
    return <Navigate to={APP_PATHS.app} replace />;
  }

  if (allowedRoles.includes(tenant.role)) {
    return children ? <>{children}</> : <Outlet />;
  }

  return <Navigate to={getTenantHomePath(tenant)} replace />;
}

export default RequireRole;
