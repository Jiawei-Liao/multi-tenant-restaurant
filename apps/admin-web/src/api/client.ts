import { fetchWithAuthentication } from "@/features/auth/apiIntegration";

/**
 * The authenticated entry point for feature API requests. Feature modules
 * should use this instead of constructing bearer headers or refreshing tokens.
 */
export function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetchWithAuthentication(input, init);
}
