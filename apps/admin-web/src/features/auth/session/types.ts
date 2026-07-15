export type UserRole = "OWNER" | "ADMIN" | "STAFF";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
};

export type AuthTenant = {
  id: string;
  subdomain: string;
  name: string;
  iconUrl: string | null;
  role: UserRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  tenant: AuthTenant | null;
  tenants: AuthTenant[];
};

export type ApiError = {
  code?: string;
  message?: string;
  details?: unknown;
};

export type AccountSignupInput = {
  firstName: string;
  lastName: string | null;
  email: string;
  password: string;
};
