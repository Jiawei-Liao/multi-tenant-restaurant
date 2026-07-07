import { API_BASE_URL } from "@/config";
import { DomainCheckError, DomainTakenError } from "./types";
import type { ApiError, InitiateSignupInput, CompleteSignupInput } from "./types";

export async function checkDomainAvailability(
  domain: string,
  signal: AbortSignal,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/signup/domain-availability?domain=${encodeURIComponent(domain)}`,
    { signal },
  );

  if (!response.ok) {
    throw new DomainCheckError(await parseApiError(response));
  }

  const data = (await response.json()) as {
    available: boolean;
    suggestions: string[];
  };

  if (!data.available) {
    throw new DomainTakenError(data.suggestions ?? []);
  }

  return data;
}

export function initiateSignup(input: InitiateSignupInput) {
  return fetch(`${API_BASE_URL}/api/admin/signup/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function completeSignup(input: CompleteSignupInput) {
  return fetch(`${API_BASE_URL}/api/admin/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    return (await response.json()) as ApiError;
  } catch {
    return {};
  }
}
