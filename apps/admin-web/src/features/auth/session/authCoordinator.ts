import { API_BASE_URL } from "@/config";
import { setLastTenantId } from "../tenant-access/tenantPreference";
import {
  ANONYMOUS_AUTH_STATE,
  INITIAL_AUTH_STATE,
  authenticatedState,
  authErrorState,
  type AuthState,
} from "./authState";
import {
  ApiClientError,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  selectTenantRequest,
  signupRequest,
} from "./authTransport";
import {
  openAuthSyncChannel,
  type AuthSyncChannel,
  type AuthSyncMessage,
} from "./authSync";
import type { AccountSignupInput, AuthSession, AuthTenant } from "./types";

type Listener = () => void;

type SelectionRequest = {
  tenantId: string;
  request: Promise<AuthTenant>;
};

class AuthCoordinator {
  private state: AuthState = INITIAL_AUTH_STATE;
  private readonly listeners = new Set<Listener>();
  private operation = 0;
  // A user/account/tenant transition is a hard replay boundary. It advances at
  // intent time so an older write request is never replayed after the user has
  // started switching context, even when that transition later fails.
  private sessionBoundary = 0;
  private consumerCount = 0;
  private refreshRequest: Promise<AuthSession | null> | null = null;
  private restoreRequest: Promise<void> | null = null;
  private selectionRequest: SelectionRequest | null = null;
  private syncChannel: AuthSyncChannel | null = null;

  readonly subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = () => this.state;

  start = () => {
    this.consumerCount += 1;

    if (this.consumerCount === 1) {
      this.syncChannel = openAuthSyncChannel(this.handleSyncMessage);

      if (this.state.status === "loading") {
        void this.retry().catch(() => undefined);
      }
    }

    return () => {
      this.consumerCount = Math.max(0, this.consumerCount - 1);

      if (this.consumerCount === 0) {
        this.syncChannel?.close();
        this.syncChannel = null;
      }
    };
  };

  login = async (input: { email: string; password: string }) => {
    this.operation += 1;
    this.sessionBoundary += 1;
    const session = await loginRequest(input);

    // A successful request has already replaced the browser cookie. Commit and
    // broadcast it even if another transition began while the request ran; the
    // cookie-mutation queue determines which later transition ultimately wins.
    this.applySession(session);
    this.publish({ type: "session-invalidated", reason: "login" });
  };

  signup = async (input: AccountSignupInput) => {
    this.operation += 1;
    this.sessionBoundary += 1;
    const session = await signupRequest(input);

    this.applySession(session);
    this.publish({ type: "session-invalidated", reason: "signup" });
  };

  retry = (): Promise<void> => {
    if (this.restoreRequest) {
      return this.restoreRequest;
    }

    const currentSession = this.currentSession();

    if (!currentSession) {
      this.setState(INITIAL_AUTH_STATE);
    }

    const operation = ++this.operation;
    const request = (async () => {
      try {
        const session = await this.requestRefresh();

        if (operation !== this.operation) {
          return;
        }

        this.applyRefreshResult(session);
      } catch (error) {
        if (operation === this.operation && !this.currentSession()) {
          this.setState(authErrorState(toError(error)));
        }

        throw error;
      }
    })();

    this.restoreRequest = request;
    const clearRestoreRequest = () => {
      if (this.restoreRequest === request) {
        this.restoreRequest = null;
      }
    };
    void request.then(clearRestoreRequest, clearRestoreRequest);

    return request;
  };

  selectTenant = (tenantId: string): Promise<AuthTenant> => {
    if (this.selectionRequest?.tenantId === tenantId) {
      return this.selectionRequest.request;
    }

    if (this.selectionRequest) {
      return Promise.reject(
        new Error("Another restaurant selection is already in progress."),
      );
    }

    this.operation += 1;
    this.sessionBoundary += 1;
    const request = this.performTenantSelection(tenantId);
    this.selectionRequest = { tenantId, request };

    const clearSelectionRequest = () => {
      if (this.selectionRequest?.request === request) {
        this.selectionRequest = null;
      }
    };
    void request.then(clearSelectionRequest, clearSelectionRequest);

    return request;
  };

  logout = async () => {
    this.operation += 1;
    this.sessionBoundary += 1;

    // Publish only after the server has revoked the HttpOnly session. Keeping
    // the current state when this request fails makes it clear that logout did
    // not complete and avoids a reload unexpectedly signing the user back in.
    await logoutRequest();
    this.applyAnonymous();
    this.publish({ type: "logged-out" });
  };

  fetchWithAuth = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<Response> => {
    const initialSession = this.currentSession();
    const initialSessionBoundary = this.sessionBoundary;

    if (!initialSession) {
      throw new Error("An authenticated session is required.");
    }

    const request = createApiRequest(input, init);
    const retryRequest = request.clone();
    const response = await fetch(
      withAccessToken(request, initialSession.accessToken),
    );

    if (response.status !== 401) {
      return response;
    }

    const newerSession = this.currentSession();

    if (
      this.sessionBoundary === initialSessionBoundary &&
      newerSession &&
      newerSession.accessToken !== initialSession.accessToken
    ) {
      return sameSessionIdentity(newerSession, initialSession)
        ? fetch(withAccessToken(retryRequest, newerSession.accessToken))
        : response;
    }

    const refreshedSession = await this.requestRefresh();

    if (this.sessionBoundary !== initialSessionBoundary) {
      return response;
    }

    if (!refreshedSession) {
      this.applyRefreshResult(null);
      return response;
    }

    if (!sameSessionIdentity(refreshedSession, initialSession)) {
      // The browser-wide refresh cookie now represents another account or
      // tenant. Install that session explicitly, but never replay the original
      // request under a different identity.
      this.applyRefreshResult(refreshedSession);
      return response;
    }

    this.applyRefreshResult(refreshedSession);
    return fetch(withAccessToken(retryRequest, refreshedSession.accessToken));
  };

  private performTenantSelection = async (
    tenantId: string,
  ): Promise<AuthTenant> => {
    if (this.refreshRequest) {
      const refreshedSession = await this.refreshRequest;

      this.applyRefreshResult(refreshedSession);
    }

    const currentSession = this.currentSession();

    if (!currentSession?.accessToken) {
      throw new Error("No authenticated session available.");
    }

    if (!currentSession.tenants.some((tenant) => tenant.id === tenantId)) {
      throw new Error("That restaurant is not available to this account.");
    }

    let nextSession: AuthSession;

    try {
      nextSession = await selectTenantRequest(
        tenantId,
        currentSession.accessToken,
      );
    } catch (error) {
      const shouldRefresh =
        error instanceof ApiClientError &&
        (error.status === 401 ||
          (error.status === 403 && error.code === "TENANT_ACCESS_DENIED"));

      if (!shouldRefresh) {
        throw error;
      }

      const refreshedSession = await this.requestRefresh();

      if (!refreshedSession) {
        this.applyRefreshResult(null);
        throw new Error("Your session has expired. Please log in again.");
      }

      if (refreshedSession.user.id !== currentSession.user.id) {
        this.applyRefreshResult(refreshedSession);
        throw new Error("The signed-in account changed in another tab.");
      }

      this.applyRefreshResult(refreshedSession);

      if (error.status === 403) {
        throw new Error(
          "That restaurant is no longer available to this account.",
        );
      }

      if (!refreshedSession.tenants.some((tenant) => tenant.id === tenantId)) {
        throw new Error(
          "That restaurant is no longer available to this account.",
        );
      }

      nextSession =
        refreshedSession.tenant?.id === tenantId
          ? refreshedSession
          : await selectTenantRequest(tenantId, refreshedSession.accessToken);
    }

    const tenant = nextSession.tenant;

    if (!tenant || tenant.id !== tenantId) {
      // The response is still the server's new cookie-backed session. Keep the
      // browser tabs aligned even though the contract violation is surfaced to
      // the caller.
      this.applyRefreshResult(nextSession);
      this.publish({ type: "session-invalidated", reason: "tenant-change" });
      throw new Error("The server selected an unexpected restaurant.");
    }

    setLastTenantId(nextSession.user.id, tenantId);
    this.applySession(nextSession);
    this.publish({ type: "session-invalidated", reason: "tenant-change" });
    return tenant;
  };

  private requestRefresh = (): Promise<AuthSession | null> => {
    if (!this.refreshRequest) {
      const request = refreshSessionRequest();
      this.refreshRequest = request;

      const clearRefreshRequest = () => {
        if (this.refreshRequest === request) {
          this.refreshRequest = null;
        }
      };
      void request.then(clearRefreshRequest, clearRefreshRequest);
    }

    return this.refreshRequest;
  };

  private handleSyncMessage = (message: AuthSyncMessage) => {
    if (message.type === "logged-out") {
      this.operation += 1;
      this.sessionBoundary += 1;
      this.applyAnonymous();
      return;
    }

    // Login and tenant selection both replace the single browser-wide refresh
    // cookie. Other tabs deliberately rebuild their local in-memory session.
    const operation = ++this.operation;
    this.sessionBoundary += 1;
    this.setState(INITIAL_AUTH_STATE);
    void this.refreshAfterSyncChange(operation);
  };

  private refreshAfterSyncChange = async (operation: number) => {
    if (this.restoreRequest) {
      try {
        await this.restoreRequest;
      } catch {
        // The new browser-wide session still gets its own restore attempt.
      }
    }

    if (this.refreshRequest) {
      try {
        await this.refreshRequest;
      } catch {
        // A refresh that started before the sync event is stale either way.
      }
    }

    if (operation !== this.operation) {
      return;
    }

    await this.retry().catch(() => undefined);
  };

  private currentSession() {
    return this.state.status === "authenticated" ? this.state.session : null;
  }

  private applySession(session: AuthSession) {
    this.setState(authenticatedState(session));
  }

  private applyRefreshResult(session: AuthSession | null) {
    const currentSession = this.currentSession();

    if (!session) {
      if (currentSession) {
        this.sessionBoundary += 1;
      }

      this.applyAnonymous();
      return;
    }

    if (currentSession && !sameSessionIdentity(currentSession, session)) {
      this.sessionBoundary += 1;
    }

    this.applySession(session);
  }

  private applyAnonymous() {
    this.setState(ANONYMOUS_AUTH_STATE);
  }

  private setState(state: AuthState) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }

  private publish(message: AuthSyncMessage) {
    this.syncChannel?.publish(message);
  }
}

function sameSessionIdentity(left: AuthSession, right: AuthSession) {
  return left.user.id === right.user.id && left.tenant?.id === right.tenant?.id;
}

function createApiRequest(input: RequestInfo | URL, init: RequestInit) {
  const apiBaseUrl = new URL(
    API_BASE_URL || window.location.origin,
    window.location.origin,
  );
  const requestInput =
    typeof input === "string" || input instanceof URL
      ? new URL(input.toString(), apiBaseUrl)
      : input;
  const request = new Request(requestInput, init);
  const requestUrl = new URL(request.url);

  if (
    requestUrl.origin !== apiBaseUrl.origin ||
    !requestUrl.pathname.startsWith("/api/")
  ) {
    throw new Error("Authenticated requests must target the configured API.");
  }

  return request;
}

function withAccessToken(request: Request, accessToken: string) {
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return new Request(request, { headers });
}

function toError(value: unknown) {
  return value instanceof Error ? value : new Error("Authentication failed.");
}

export const authCoordinator = new AuthCoordinator();
