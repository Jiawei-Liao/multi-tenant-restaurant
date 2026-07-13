import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { APP_ICON_URL, APP_NAME } from "@/shared/branding";
import { isTenantWorkspacePath } from "@/shared/routePaths";

function TenantBranding() {
  const { currentTenant } = useAuth();
  const { pathname } = useLocation();
  const tenant = isTenantWorkspacePath(pathname) ? currentTenant : null;

  useEffect(() => {
    document.title = tenant ? `${tenant.name} Admin` : APP_NAME;
    getFaviconLink().href = tenant?.iconUrl || APP_ICON_URL;
  }, [tenant]);

  return null;
}

function getFaviconLink() {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.append(link);
  }

  return link;
}

export default TenantBranding;
