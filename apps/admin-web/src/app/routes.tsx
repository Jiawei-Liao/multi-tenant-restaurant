import { Navigate, Route, Routes } from "react-router-dom";
import {
  LoginPage,
  RequireAnonymous,
  RequireAuth,
  RequireRole,
  SelectTenantPage,
  SignupPage,
  TenantEntryRoute,
  useAuth,
} from "@/features/auth";
import { CreateRestaurantPage, OnboardingPage } from "@/features/tenants";
import AdminHome from "@/features/admin-home/AdminHome";
import Locations from "@/features/locations/Locations";
import Menu from "@/features/menu/Menu";
import Orders from "@/features/orders/Orders";
import RestaurantManagement from "@/features/restaurant/RestaurantManagement";
import Settings from "@/features/settings/Settings";
import StaffAllocation from "@/features/staff/StaffAllocation";
import StaffHome from "@/features/staff-home/StaffHome";
import AppLayout from "@/layout/AppLayout";
import { APP_PATHS } from "@/shared/routePaths";
import Home from "./Home";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={APP_PATHS.home} element={<Home />} />

      <Route element={<RequireAnonymous />}>
        <Route path={APP_PATHS.login} element={<LoginPage />} />
        <Route path={APP_PATHS.signup} element={<SignupPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path={APP_PATHS.app} element={<TenantEntryRoute />} />
          <Route path={APP_PATHS.onboarding} element={<OnboardingRoute />} />
          <Route path={APP_PATHS.createRestaurant} element={<CreateRestaurantPage />} />
          <Route path={APP_PATHS.selectTenant} element={<SelectTenantPage />} />
          <Route path={APP_PATHS.settings} element={<Settings />} />

          <Route element={<RequireAuth requireTenant />}>
            <Route
              element={<RequireRole allowedRoles={["OWNER", "ADMIN"]} />}
            >
              <Route path={APP_PATHS.adminHome} element={<AdminHome />} />
              <Route path={APP_PATHS.adminMenu} element={<Menu />} />
              <Route path={APP_PATHS.adminLocations} element={<Locations />} />
              <Route
                path={APP_PATHS.adminStaff}
                element={<StaffAllocation />}
              />
            </Route>

            <Route element={<RequireRole allowedRoles={["OWNER"]} />}>
              <Route
                path={APP_PATHS.adminRestaurant}
                element={<RestaurantManagement />}
              />
            </Route>

            <Route element={<RequireRole allowedRoles={["STAFF"]} />}>
              <Route path={APP_PATHS.staffHome} element={<StaffHome />} />
              <Route path={APP_PATHS.staffOrders} element={<Orders />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={APP_PATHS.home} replace />} />
    </Routes>
  );
}

function OnboardingRoute() {
  const { user, currentTenant, availableTenants } = useAuth();

  if (!user) {
    return null;
  }

  if (currentTenant || availableTenants.length > 0) {
    return <Navigate to={APP_PATHS.app} replace />;
  }

  return <OnboardingPage />;
}
