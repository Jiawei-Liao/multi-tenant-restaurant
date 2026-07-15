import { apiFetch } from "@/api/client";

export type SubdomainAvailabilityResponse = {
  available: boolean;
  suggestions: string[];
};

export type InitiateRestaurantCreationInput = {
  subdomain: string;
  name: string;
  iconContentType: string | null;
  iconSizeBytes: number | null;
};

export type InitiateRestaurantCreationResponse = {
  tenantId: string;
  iconUploadUrl: string | null;
};

export type CompleteRestaurantCreationInput = {
  tenantId: string;
  subdomain: string;
  name: string;
  iconContentType: string | null;
};

export type CompleteRestaurantCreationResponse = {
  id: string;
  subdomain: string;
  name: string;
  iconUrl: string | null;
  role: "OWNER";
};

export class RestaurantApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;

  constructor(
    status: number,
    code: string | null,
    message: string,
    details: unknown = null,
  ) {
    super(message);
    this.name = "RestaurantApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function checkSubdomainAvailability(
  subdomain: string,
  signal: AbortSignal,
): Promise<SubdomainAvailabilityResponse> {
  const response = await apiFetch(
    `/api/tenants/subdomain-availability?subdomain=${encodeURIComponent(subdomain)}`,
    { signal },
  );

  await requireSuccess(response);
  const value = await parseSuccessJson(response);

  if (
    !isRecord(value) ||
    typeof value.available !== "boolean" ||
    !Array.isArray(value.suggestions) ||
    !value.suggestions.every((suggestion) => typeof suggestion === "string")
  ) {
    throw invalidResponseError();
  }

  return {
    available: value.available,
    suggestions: value.suggestions,
  };
}

export async function initiateRestaurantCreation(
  input: InitiateRestaurantCreationInput,
): Promise<InitiateRestaurantCreationResponse> {
  const response = await apiFetch("/api/tenants/initiate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  await requireSuccess(response);
  const value = await parseSuccessJson(response);

  if (
    !isRecord(value) ||
    !isNonEmptyString(value.tenantId) ||
    !(value.iconUploadUrl === null || isNonEmptyString(value.iconUploadUrl))
  ) {
    throw invalidResponseError();
  }

  return {
    tenantId: value.tenantId,
    iconUploadUrl: value.iconUploadUrl,
  };
}

export async function uploadRestaurantIcon(
  url: string,
  file: File,
): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  await requireSuccess(response);
}

export async function completeRestaurantCreation(
  input: CompleteRestaurantCreationInput,
): Promise<CompleteRestaurantCreationResponse> {
  const response = await apiFetch("/api/tenants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  await requireSuccess(response);
  const value = await parseSuccessJson(response);

  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.subdomain) ||
    !isNonEmptyString(value.name) ||
    !(value.iconUrl === null || typeof value.iconUrl === "string") ||
    value.role !== "OWNER"
  ) {
    throw invalidResponseError();
  }

  return {
    id: value.id,
    subdomain: value.subdomain,
    name: value.name,
    iconUrl: value.iconUrl,
    role: value.role,
  };
}

async function requireSuccess(response: Response): Promise<void> {
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
}

async function parseErrorResponse(response: Response) {
  let value: unknown;

  try {
    value = await response.json();
  } catch {
    value = null;
  }

  const code =
    isRecord(value) && typeof value.code === "string" ? value.code : null;
  const message =
    isRecord(value) &&
    typeof value.message === "string" &&
    value.message.length > 0
      ? value.message
      : `Request failed with status ${response.status}`;
  const details =
    isRecord(value) && Object.hasOwn(value, "details") ? value.details : null;

  return new RestaurantApiError(response.status, code, message, details);
}

async function parseSuccessJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw invalidResponseError();
  }
}

function invalidResponseError() {
  return new RestaurantApiError(
    502,
    "INVALID_API_RESPONSE",
    "The server returned an invalid restaurant response.",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
