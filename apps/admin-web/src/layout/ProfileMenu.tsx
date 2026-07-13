import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import { useAuth } from "@/features/auth";
import { APP_PATHS } from "@/shared/routePaths";
import { getFullName, getInitials } from "./profileIdentity";
import type { HeaderMenuPresentation } from "./Header";
import styles from "./ProfileMenu.module.css";

type ProfileMenuProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  presentation: HeaderMenuPresentation;
};

function ProfileMenu({ onOpenChange, open, presentation }: ProfileMenuProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const fullName = getFullName(user);
  const trigger = (
    <Button
      aria-label={`Open account menu for ${fullName}`}
      className={styles.profileTrigger}
      title={fullName}
      type="button"
      variant="ghost"
    >
      <span aria-hidden="true" className={styles.profileAvatar}>
        {getInitials(user)}
      </span>
    </Button>
  );

  function openSettings() {
    onOpenChange(false);
    navigate(APP_PATHS.settings);
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      onOpenChange(false);
      navigate(APP_PATHS.login, { replace: true });
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (presentation === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger render={trigger} />
        <SheetContent className={styles.bottomSheet} side="bottom">
          <SheetHeader className={styles.accountSheetHeader}>
            <SheetTitle>{fullName}</SheetTitle>
            <SheetDescription>{user.email}</SheetDescription>
          </SheetHeader>
          <div className={styles.mobileAccountActions}>
            <button
              className={styles.mobileAccountAction}
              type="button"
              onClick={openSettings}
            >
              <Settings aria-hidden="true" />
              Settings
            </button>
            <button
              className={styles.mobileAccountAction}
              disabled={isLoggingOut}
              type="button"
              onClick={() => void handleLogout()}
            >
              <LogOut aria-hidden="true" />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        align="end"
        className={styles.profileMenu}
        sideOffset={10}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className={styles.profileSummary}>
            <span className={styles.profileName}>{fullName}</span>
            <span className={styles.profileEmail}>{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openSettings}>
          <Settings aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          closeOnClick={false}
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          <LogOut aria-hidden="true" />
          {isLoggingOut ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileMenu;
