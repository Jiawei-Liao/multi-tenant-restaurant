import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, LoaderCircle, Plus } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@multi-tenant-restaurant/ui";
import { useAuth, type AuthTenant, type UserRole } from "@/features/auth";
import { useTenantSelection } from "@/features/tenants";
import { APP_ICON_URL, APP_NAME } from "@/shared/branding";
import { APP_PATHS } from "@/shared/routePaths";
import type { HeaderMenuPresentation } from "./Header";
import TenantAvatar from "./TenantAvatar";
import styles from "./TenantMenu.module.css";

type TenantMenuProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  presentation: HeaderMenuPresentation;
  showTenantIdentity: boolean;
};

function TenantMenu({
  onOpenChange,
  open,
  presentation,
  showTenantIdentity,
}: TenantMenuProps) {
  const navigate = useNavigate();
  const { availableTenants, currentTenant } = useAuth();
  const { isSelecting, openTenant, pendingTenantId } = useTenantSelection();
  const identityTenant = showTenantIdentity ? currentTenant : null;
  const tenants = useMemo(
    () => sortTenants(availableTenants, currentTenant?.id ?? null),
    [availableTenants, currentTenant?.id],
  );
  const isInteractive = tenants.length > 0;

  async function handleTenantClick(tenant: AuthTenant) {
    if (tenant.id === currentTenant?.id) {
      onOpenChange(false);
      return;
    }

    if (await openTenant(tenant.id)) {
      onOpenChange(false);
    }
  }

  function handleCreateRestaurant() {
    onOpenChange(false);
    navigate(APP_PATHS.createRestaurant);
  }

  const triggerContent = (
    <>
      {identityTenant ? (
        <TenantAvatar tenant={identityTenant} />
      ) : (
        <img
          alt=""
          aria-hidden="true"
          className={styles.appIcon}
          src={APP_ICON_URL}
        />
      )}
      <span className={styles.identityName}>
        {identityTenant?.name ?? APP_NAME}
      </span>
      {isInteractive ? (
        <ChevronDown aria-hidden="true" className={styles.identityChevron} />
      ) : null}
    </>
  );

  if (!isInteractive) {
    return <div className={styles.identityStatic}>{triggerContent}</div>;
  }

  const triggerLabel = identityTenant
    ? `Open restaurant menu. Current restaurant: ${identityTenant.name}`
    : "Open restaurant menu";

  if (presentation === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger
          render={
            <Button
              aria-label={triggerLabel}
              className={styles.identityTrigger}
              title={identityTenant?.name ?? APP_NAME}
              type="button"
              variant="ghost"
            />
          }
        >
          {triggerContent}
        </SheetTrigger>
        <SheetContent className={styles.bottomSheet} side="bottom">
          <SheetHeader className={styles.sheetHeader}>
            <SheetTitle>Restaurants</SheetTitle>
            <SheetDescription>
              Choose the restaurant you want to manage.
            </SheetDescription>
          </SheetHeader>
          <div className={styles.mobileTenantList}>
            {tenants.map((tenant) => (
              <TenantChoice
                currentTenantId={currentTenant?.id ?? null}
                disabled={isSelecting}
                isPending={pendingTenantId === tenant.id}
                key={tenant.id}
                tenant={tenant}
                onClick={() => void handleTenantClick(tenant)}
              />
            ))}
          </div>
          <div className={styles.sheetFooter}>
            <Button
              className={styles.createButton}
              type="button"
              variant="ghost"
              onClick={handleCreateRestaurant}
            >
              <Plus aria-hidden="true" />
              Create restaurant
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={triggerLabel}
            className={styles.identityTrigger}
            title={identityTenant?.name ?? APP_NAME}
            type="button"
            variant="ghost"
          />
        }
      >
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent className={styles.tenantMenu} sideOffset={10}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className={styles.menuHeading}>
            Restaurants
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <div className={styles.desktopTenantList}>
          {tenants.map((tenant) => {
            const isCurrent = tenant.id === currentTenant?.id;
            const isPending = pendingTenantId === tenant.id;

            return (
              <DropdownMenuItem
                aria-current={isCurrent ? "true" : undefined}
                className={styles.tenantMenuItem}
                closeOnClick={false}
                disabled={isSelecting}
                key={tenant.id}
                label={tenant.name}
                onClick={() => void handleTenantClick(tenant)}
              >
                <TenantAvatar
                  className={styles.tenantChoiceAvatar}
                  tenant={tenant}
                />
                <TenantChoiceText tenant={tenant} />
                <TenantChoiceStatus
                  isCurrent={isCurrent}
                  isPending={isPending}
                />
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={styles.createMenuItem}
          onClick={handleCreateRestaurant}
        >
          <Plus aria-hidden="true" />
          Create restaurant
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type TenantChoiceProps = {
  currentTenantId: string | null;
  disabled: boolean;
  isPending: boolean;
  onClick: () => void;
  tenant: AuthTenant;
};

function TenantChoice({
  currentTenantId,
  disabled,
  isPending,
  onClick,
  tenant,
}: TenantChoiceProps) {
  const isCurrent = tenant.id === currentTenantId;

  return (
    <button
      aria-current={isCurrent ? "true" : undefined}
      className={`${styles.mobileTenantChoice} ${
        isCurrent ? styles.currentTenantChoice : ""
      }`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <TenantAvatar className={styles.tenantChoiceAvatar} tenant={tenant} />
      <TenantChoiceText tenant={tenant} />
      <TenantChoiceStatus isCurrent={isCurrent} isPending={isPending} />
    </button>
  );
}

function TenantChoiceText({ tenant }: { tenant: AuthTenant }) {
  return (
    <span className={styles.tenantChoiceText}>
      <span className={styles.tenantChoiceName}>{tenant.name}</span>
      <span className={styles.tenantChoiceRole}>{formatRole(tenant.role)}</span>
    </span>
  );
}

function TenantChoiceStatus({
  isCurrent,
  isPending,
}: {
  isCurrent: boolean;
  isPending: boolean;
}) {
  if (isPending) {
    return (
      <LoaderCircle
        aria-label="Opening restaurant"
        className={`${styles.statusIcon} ${styles.spinner}`}
      />
    );
  }

  return isCurrent ? (
    <Check aria-label="Current restaurant" className={styles.statusIcon} />
  ) : null;
}

function sortTenants(tenants: AuthTenant[], currentTenantId: string | null) {
  return [...tenants].sort((left, right) => {
    if (left.id === currentTenantId) return -1;
    if (right.id === currentTenantId) return 1;
    return left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });
  });
}

function formatRole(role: UserRole) {
  return role.charAt(0) + role.slice(1).toLocaleLowerCase();
}

export default TenantMenu;
