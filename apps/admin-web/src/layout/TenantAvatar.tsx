import { useEffect, useState } from "react";
import type { AuthTenant } from "@/features/auth";
import styles from "./TenantMenu.module.css";

type TenantAvatarProps = {
  className?: string;
  tenant: Pick<AuthTenant, "iconUrl" | "name">;
};

function TenantAvatar({ className = "", tenant }: TenantAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const initial = Array.from(tenant.name.trim())[0]?.toLocaleUpperCase() || "R";

  useEffect(() => setHasImageError(false), [tenant.iconUrl]);

  if (tenant.iconUrl && !hasImageError) {
    return (
      <img
        alt=""
        className={`${styles.tenantAvatar} ${className}`}
        src={tenant.iconUrl}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${styles.tenantAvatar} ${styles.tenantAvatarFallback} ${className}`}
    >
      {initial}
    </span>
  );
}

export default TenantAvatar;
