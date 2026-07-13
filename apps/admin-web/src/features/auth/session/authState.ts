import type { AuthSession } from "./types";

export type AuthState =
  | {
      status: "loading";
      session: null;
      error: null;
    }
  | {
      status: "anonymous";
      session: null;
      error: null;
    }
  | {
      status: "authenticated";
      session: AuthSession;
      error: null;
    }
  | {
      status: "error";
      session: null;
      error: Error;
    };

export const INITIAL_AUTH_STATE: AuthState = {
  status: "loading",
  session: null,
  error: null,
};

export function authenticatedState(session: AuthSession): AuthState {
  return {
    status: "authenticated",
    session,
    error: null,
  };
}

export const ANONYMOUS_AUTH_STATE: AuthState = {
  status: "anonymous",
  session: null,
  error: null,
};

export function authErrorState(error: Error): AuthState {
  return {
    status: "error",
    session: null,
    error,
  };
}
