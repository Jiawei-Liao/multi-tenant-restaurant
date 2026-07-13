import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { isTenantWorkspacePath } from "@/shared/routePaths";
import AppNavigation from "./AppNavigation";
import Header from "./Header";
import { useIsMobile } from "./useIsMobile";
import styles from "./AppLayout.module.css";

function AppLayout() {
  const { currentTenant } = useAuth();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const tenant = isTenantWorkspacePath(pathname) ? currentTenant : null;
  const hasDesktopSidebar = tenant !== null && !isMobile;
  const isSidebarExpanded = isMobile
    ? isMobileSidebarOpen
    : !isDesktopSidebarCollapsed;

  useEffect(() => setIsMobileSidebarOpen(false), [pathname]);

  useEffect(() => {
    if (!isMobile || !tenant) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, tenant]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen((current) => !current);
      return;
    }

    setIsDesktopSidebarCollapsed((current) => !current);
  };

  return (
    <div className={styles.shell}>
      <Header
        menuPresentation={isMobile ? "sheet" : "dropdown"}
        navigationToggle={
          tenant
            ? {
                controlsId: isMobile
                  ? "mobile-navigation"
                  : "desktop-navigation",
                expanded: isSidebarExpanded,
                label: isMobile
                  ? isSidebarExpanded
                    ? "Close navigation"
                    : "Open navigation"
                  : isSidebarExpanded
                    ? "Collapse navigation"
                    : "Expand navigation",
                onToggle: toggleSidebar,
              }
            : null
        }
        showTenantIdentity={tenant !== null}
      />

      <div
        className={`${styles.body} ${
          hasDesktopSidebar && isDesktopSidebarCollapsed
            ? styles.bodyCollapsed
            : ""
        } ${!hasDesktopSidebar ? styles.bodyWithoutSidebar : ""}`}
      >
        {tenant ? (
          <AppNavigation
            desktopCollapsed={isDesktopSidebarCollapsed}
            isMobile={isMobile}
            mobileOpen={isMobileSidebarOpen}
            role={tenant.role}
            tenantName={tenant.name}
            onMobileOpenChange={setIsMobileSidebarOpen}
          />
        ) : null}

        <main className={styles.content} id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
