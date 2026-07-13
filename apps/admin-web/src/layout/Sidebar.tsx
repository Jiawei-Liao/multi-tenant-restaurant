import { NavLink } from "react-router-dom";
import type { UserRole } from "@/features/auth";
import { NAV_BY_ROLE } from "./nav-config";
import styles from "./AppNavigation.module.css";

type SidebarProps = {
  className?: string;
  id?: string;
  isCollapsed: boolean;
  onNavigate?: () => void;
  role: UserRole;
};

function Sidebar({
  className = "",
  id,
  isCollapsed,
  onNavigate,
  role,
}: SidebarProps) {
  return (
    <aside
      aria-label="Primary"
      className={`${styles.sidebar} ${
        isCollapsed ? styles.sidebarCollapsed : ""
      } ${className}`}
      id={id}
    >
      <nav className={styles.nav}>
        {NAV_BY_ROLE[role].map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
              end={item.end}
              key={item.path}
              title={isCollapsed ? item.label : undefined}
              to={item.path}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
