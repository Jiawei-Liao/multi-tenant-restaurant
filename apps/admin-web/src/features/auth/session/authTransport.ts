import { API_BASE_URL } from "@/config";
import { withAuthCookieLock } from "./authSync";
import type {
  AccountSignupInput,
  ApiError,
  AuthSession,
  AuthTenant,
  AuthUser,
  UserRole,
} from "./types";

const AUTH_ROLES: readonly UserRole[] = ["OWNER", "ADMIN", "STAFF"];
const AUTH_REQUEST_TIMEOUT_MS = 15_000;
const ROTATION_RETRY_DELAYS_MS = [75, 200] as const;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;

  constructor(status: number, payload: ApiError) {
    super(
      typeof payload?.message === "string" && payload.message
        ? payload.message
        : `Request failed with status ${status}`,
    );
    this.name = "ApiClientError";
    this.status = status;
    this.code = typeof payload?.code === "string" ? payload.code : null;
    this.details = payload?.details;
  }
}

export async function signupRequest(
  input: AccountSignupInput,
): Promise<AuthSession> {
  return withAuthCookieLock(() =>
    requestAuthSession("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  );
}

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  return withAuthCookieLock(() =>
    requestAuthSession("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  );
}

export function refreshSessionRequest(): Promise<AuthSession | null> {
  return withAuthCookieLock(performRefreshWithoutLock);
}

async function performRefreshWithoutLock(
  retryAttempt = 0,
): Promise<AuthSession | null> {
  const response = await authFetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const error = await toApiClientError(response);
    const retryDelay = ROTATION_RETRY_DELAYS_MS[retryAttempt];

    if (isRotationConflict(error) && retryDelay !== undefined) {
      await delay(retryDelay);
      return performRefreshWithoutLock(retryAttempt + 1);
    }

    throw error;
  }

  return parseAuthSession(await response.json());
}

export async function logoutRequest(): Promise<void> {
  return withAuthCookieLock(async () => {
    const response = await authFetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok && response.status !== 401) {
      throw await toApiClientError(response);
    }
  });
}

export async function selectTenantRequest(
  tenantId: string,
  token: string,
): Promise<AuthSession> {
  return withAuthCookieLock(() =>
    requestAuthSession("/api/auth/select-tenant", {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tenantId }),
    }),
  );
}

async function requestAuthSession(
  path: string,
  init: RequestInit,
  retryAttempt = 0,
): Promise<AuthSession> {
  const response = await authFetch(apiUrl(path), init);

  if (!response.ok) {
    const error = await toApiClientError(response);
    const retryDelay = ROTATION_RETRY_DELAYS_MS[retryAttempt];

    if (isRotationConflict(error) && retryDelay !== undefined) {
      await delay(retryDelay);
      return requestAuthSession(path, init, retryAttempt + 1);
    }

    throw error;
  }

  return parseAuthSession(await response.json());
}

function authFetch(input: RequestInfo | URL, init: RequestInit) {
  return fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
  });
}

function apiUrl(path: string) {
  const baseUrl = API_BASE_URL || window.location.origin;
  return new URL(path, baseUrl).toString();
}

function isRotationConflict(error: ApiClientError) {
  return error.status === 409 && error.code === "REFRESH_TOKEN_ALREADY_ROTATED";
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}

async function toApiClientError(response: Response) {
  let payload: ApiError = {};

  try {
    const body: unknown = await response.json();

    if (isRecord(body)) {
      payload = {
        code: typeof body.code === "string" ? body.code : undefined,
        message: typeof body.message === "string" ? body.message : undefined,
        details: body.details,
      };
    }
  } catch {}

  return new ApiClientError(response.status, payload);
}

function parseAuthSession(value: unknown): AuthSession {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  const { accessToken, user, tenant, tenants } = value;

  if (
    typeof accessToken !== "string" ||
    accessToken.length === 0 ||
    !isAuthUser(user) ||
    !(tenant === null || isAuthTenant(tenant)) ||
    !Array.isArray(tenants) ||
    !tenants.every(isAuthTenant)
  ) {
    throw invalidResponseError();
  }

  return { accessToken, user, tenant, tenants };
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.firstName === "string" &&
    (value.lastName === null || typeof value.lastName === "string")
  );
}

function isAuthTenant(value: unknown): value is AuthTenant {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.subdomain === "string" &&
    typeof value.name === "string" &&
    (value.iconUrl === null || typeof value.iconUrl === "string") &&
    AUTH_ROLES.includes(value.role as UserRole)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function invalidResponseError() {
  return new ApiClientError(502, {
    code: "INVALID_API_RESPONSE",
    message: "The server returned an invalid authentication response.",
  });
}
