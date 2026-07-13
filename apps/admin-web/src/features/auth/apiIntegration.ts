import { authCoordinator } from "./session/authCoordinator";

/**
 * Narrow integration seam for the shared API client. UI features should use
 * `apiFetch` instead of importing this module or the session coordinator.
 */
export function fetchWithAuthentication(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return authCoordinator.fetchWithAuth(input, init);
}
