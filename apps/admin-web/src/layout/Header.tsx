import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@multi-tenant-restaurant/ui";
import ProfileMenu from "./ProfileMenu";
import TenantMenu from "./TenantMenu";
import styles from "./Header.module.css";

export type HeaderNavigationToggle = {
  controlsId: string;
  expanded: boolean;
  label: string;
  onToggle: () => void;
};

export type HeaderMenuPresentation = "dropdown" | "sheet";

type HeaderProps = {
  menuPresentation: HeaderMenuPresentation;
  navigationToggle: HeaderNavigationToggle | null;
  showTenantIdentity: boolean;
};

function Header({
  menuPresentation,
  navigationToggle,
  showTenantIdentity,
}: HeaderProps) {
  const [activeMenu, setActiveMenu] = useState<"tenant" | "profile" | null>(
    null,
  );

  useEffect(() => setActiveMenu(null), [menuPresentation]);

  function handleMenuOpenChange(menu: "tenant" | "profile", open: boolean) {
    setActiveMenu((current) => {
      if (open) return menu;
      return current === menu ? null : current;
    });
  }

  return (
    <header className={styles.header}>
      {navigationToggle ? (
        <Button
          aria-controls={navigationToggle.controlsId}
          aria-expanded={navigationToggle.expanded}
          aria-label={navigationToggle.label}
          className={styles.sidebarToggle}
          id="navigation-toggle"
          size="icon"
          title={navigationToggle.label}
          type="button"
          variant="ghost"
          onClick={navigationToggle.onToggle}
        >
          <Menu aria-hidden="true" />
        </Button>
      ) : null}

      <TenantMenu
        open={activeMenu === "tenant"}
        presentation={menuPresentation}
        showTenantIdentity={showTenantIdentity}
        onOpenChange={(open) => handleMenuOpenChange("tenant", open)}
      />
      <ProfileMenu
        open={activeMenu === "profile"}
        presentation={menuPresentation}
        onOpenChange={(open) => handleMenuOpenChange("profile", open)}
      />
    </header>
  );
}

export default Header;
