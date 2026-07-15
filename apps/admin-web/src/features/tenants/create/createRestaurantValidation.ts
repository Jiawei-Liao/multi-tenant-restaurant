export const SUBDOMAIN_CHECK_DELAY_MS = 450;
export const ICON_MAX_BYTES = 1024 * 1024;
export const ICON_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export type SubdomainStatus =
  "idle" | "checking" | "available" | "taken" | "invalid";

type IconFileMetadata = {
  type: string;
  size: number;
};

export function createSubdomainFromName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .trim()
    .replace(/['\u2018\u2019\u02bc]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");
}

export function filterSubdomainInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 63);
}

export function getSubdomainValidationMessage(value: string) {
  if (value.trim().length === 0) {
    return "Enter a subdomain.";
  }

  if (value.length > 63) {
    return "Use 63 characters or fewer.";
  }

  if (!/^[a-z0-9-]+$/.test(value)) {
    return "Use only lowercase letters, numbers, and hyphens.";
  }

  if (value.startsWith("-") || value.endsWith("-")) {
    return "Do not start or end with a hyphen.";
  }

  return "";
}

export function getRestaurantNameValidationMessage(value: string) {
  const name = value.trim();

  if (name.length === 0) {
    return "Enter a restaurant name.";
  }

  if (name.length > 255) {
    return "Use 255 characters or fewer.";
  }

  return "";
}

export function getIconValidationMessage(
  file: IconFileMetadata,
  maxBytes = ICON_MAX_BYTES,
  allowedTypes: ReadonlySet<string> = ICON_TYPES,
) {
  if (!allowedTypes.has(file.type)) {
    return "Use a PNG, JPEG, or WebP image.";
  }

  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > maxBytes) {
    return "Use an icon smaller than 1 MB.";
  }

  return "";
}
