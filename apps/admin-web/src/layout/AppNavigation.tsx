import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@multi-tenant-restaurant/ui";
import type { AuthTenant } from "@/features/auth";
import Sidebar from "./Sidebar";
import TenantAvatar from "./TenantAvatar";
import styles from "./AppNavigation.module.css";

type AppNavigationProps = {
  desktopCollapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  tenant: Pick<AuthTenant, "iconUrl" | "name" | "role">;
};

function AppNavigation({
  desktopCollapsed,
  isMobile,
  mobileOpen,
  onMobileOpenChange,
  tenant,
}: AppNavigationProps) {
  if (!isMobile) {
    return (
      <Sidebar
        id="desktop-navigation"
        isCollapsed={desktopCollapsed}
        role={tenant.role}
      />
    );
  }

  return (
    <Sheet
      open={mobileOpen}
      triggerId="navigation-toggle"
      onOpenChange={onMobileOpenChange}
    >
      <SheetContent
        className={styles.mobileNavigationPanel}
        id="mobile-navigation"
        side="left"
      >
        <SheetHeader className={styles.mobileNavigationHeader}>
          <SheetTitle className={styles.mobileNavigationTitle}>
            <TenantAvatar
              className={styles.mobileNavigationAvatar}
              tenant={tenant}
            />
            <span className={styles.mobileNavigationName}>{tenant.name}</span>
          </SheetTitle>
        </SheetHeader>
        <Sidebar
          className={styles.mobileSidebar}
          isCollapsed={false}
          role={tenant.role}
          onNavigate={() => onMobileOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export default AppNavigation;
