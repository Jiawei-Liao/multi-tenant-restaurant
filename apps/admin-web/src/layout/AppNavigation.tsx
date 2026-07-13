import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@multi-tenant-restaurant/ui";
import type { UserRole } from "@/features/auth";
import Sidebar from "./Sidebar";
import styles from "./AppNavigation.module.css";

type AppNavigationProps = {
  desktopCollapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  role: UserRole;
  tenantName: string;
};

function AppNavigation({
  desktopCollapsed,
  isMobile,
  mobileOpen,
  onMobileOpenChange,
  role,
  tenantName,
}: AppNavigationProps) {
  if (!isMobile) {
    return (
      <Sidebar
        id="desktop-navigation"
        isCollapsed={desktopCollapsed}
        role={role}
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
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>{tenantName}</SheetDescription>
        </SheetHeader>
        <Sidebar
          className={styles.mobileSidebar}
          isCollapsed={false}
          role={role}
          onNavigate={() => onMobileOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export default AppNavigation;
