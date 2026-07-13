import type { AuthUser } from "@/features/auth";

type ProfileIdentity = Pick<AuthUser, "email" | "firstName" | "lastName">;

export function getInitials(user: ProfileIdentity) {
  const firstInitial = Array.from(user.firstName.trim())[0] ?? "";
  const lastInitial = Array.from(user.lastName?.trim() ?? "")[0] ?? "";
  return `${firstInitial}${lastInitial}`.toLocaleUpperCase() || "?";
}

export function getFullName(user: ProfileIdentity) {
  return (
    [user.firstName.trim(), user.lastName?.trim()].filter(Boolean).join(" ") ||
    user.email
  );
}
