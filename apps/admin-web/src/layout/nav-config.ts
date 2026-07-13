import {
  Home,
  MapPin,
  ReceiptText,
  Settings,
  Utensils,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/features/auth";
import { APP_PATHS } from "@/shared/routePaths";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  end?: boolean;
};

const ADMIN_NAV: NavItem[] = [
  { icon: Home, label: "Home", path: APP_PATHS.adminHome, end: true },
  { icon: Utensils, label: "Menu", path: APP_PATHS.adminMenu },
  { icon: MapPin, label: "Locations", path: APP_PATHS.adminLocations },
  { icon: Users, label: "Staff", path: APP_PATHS.adminStaff },
];

const STAFF_NAV: NavItem[] = [
  { icon: Home, label: "Home", path: APP_PATHS.staffHome, end: true },
  { icon: ReceiptText, label: "Orders", path: APP_PATHS.staffOrders },
];

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  OWNER: [
    ...ADMIN_NAV,
    {
      icon: Settings,
      label: "Restaurant",
      path: APP_PATHS.adminRestaurant,
    },
  ],
  ADMIN: ADMIN_NAV,
  STAFF: STAFF_NAV,
};
