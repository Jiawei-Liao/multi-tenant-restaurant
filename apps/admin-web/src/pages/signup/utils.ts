import { ERROR_MESSAGES } from "./types";
import type { ApiError } from "./types";

export function createDomainFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function filterDomainInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 63);
}

export function getDomainValidationMessage(value: string) {
  if (value.length > 63) {
    return "Use 63 characters or fewer.";
  }

  if (value.startsWith("-") || value.endsWith("-")) {
    return "Do not start or end with a hyphen.";
  }

  return "";
}

export function getIconValidationMessage(
  file: File,
  maxBytes: number,
  allowedTypes: Set<string>,
) {
  if (!allowedTypes.has(file.type)) {
    return "Use a PNG, JPEG, or WebP image.";
  }

  if (file.size > maxBytes) {
    return "Use an icon smaller than 1 MB.";
  }

  return "";
}

export function getToastMessage(error: ApiError) {
  const configuredMessage = error.code ? ERROR_MESSAGES[error.code] : undefined;

  if (configuredMessage) {
    return configuredMessage;
  }

  if (error.message && error.code === "VALIDATION_ERROR") {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
