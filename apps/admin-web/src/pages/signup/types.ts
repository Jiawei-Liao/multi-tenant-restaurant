export type SignupStep = "restaurant" | "account";
export type DomainStatus =
  "idle" | "checking" | "available" | "taken" | "invalid";

export type ApiError = {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export class DomainCheckError extends Error {
  apiError: ApiError;

  constructor(apiError: ApiError) {
    super("Domain check failed");
    this.apiError = apiError;
  }
}

// Thrown when a domain is already taken, has suggested alternatives
export class DomainTakenError extends Error {
  suggestions: string[];

  constructor(suggestions: string[]) {
    super("Domain taken");
    this.suggestions = suggestions;
  }
}

export type InitiateSignupInput = {
  domain: string;
  tenantName: string;
  iconContentType: string | null;
  iconSizeBytes: number | null;
};

export type CompleteSignupInput = {
  tenantId: string;
  domain: string;
  tenantName: string;
  ownerEmail: string;
  password: string;
};

export const DOMAIN_CHECK_DELAY_MS = 450;
export const ICON_MAX_BYTES = 1024 * 1024;
export const ICON_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const ERROR_MESSAGES: Record<string, string> = {
  ICON_TOO_LARGE: "Use an icon smaller than 1 MB.",
  ICON_TYPE_NOT_ALLOWED: "Use a PNG, JPEG, or WebP image.",
  VALIDATION_ERROR: "Check the form and try again.",
};
