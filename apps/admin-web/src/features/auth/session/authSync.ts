const AUTH_CHANNEL_NAME = "admin-web:auth-state";
const AUTH_COOKIE_LOCK_NAME = "admin-web:auth-cookie";
const AUTH_LOCK_TIMEOUT_MS = 20_000;

let authCookieQueue: Promise<void> = Promise.resolve();

export type AuthSyncMessage =
  | {
      type: "session-invalidated";
      reason: "login" | "signup" | "tenant-change";
    }
  | { type: "logged-out" };

export type AuthSyncChannel = {
  publish: (message: AuthSyncMessage) => void;
  close: () => void;
};

export function withAuthCookieLock<T>(request: () => Promise<T>): Promise<T> {
  const queuedRequest = authCookieQueue.then(
    () => withCrossTabAuthCookieLock(request),
    () => withCrossTabAuthCookieLock(request),
  );

  authCookieQueue = queuedRequest.then(
    () => undefined,
    () => undefined,
  );

  return queuedRequest;
}

export function openAuthSyncChannel(
  onMessage: (message: AuthSyncMessage) => void,
): AuthSyncChannel {
  if (typeof BroadcastChannel === "undefined") {
    return {
      publish: () => undefined,
      close: () => undefined,
    };
  }

  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (isAuthSyncMessage(event.data)) {
      onMessage(event.data);
    }
  };

  return {
    publish: (message) => channel.postMessage(message),
    close: () => channel.close(),
  };
}

function withCrossTabAuthCookieLock<T>(request: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(
      AUTH_COOKIE_LOCK_NAME,
      { signal: AbortSignal.timeout(AUTH_LOCK_TIMEOUT_MS) },
      request,
    );
  }

  return request();
}

function isAuthSyncMessage(value: unknown): value is AuthSyncMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Record<string, unknown>;

  if (message.type === "logged-out") {
    return true;
  }

  return (
    message.type === "session-invalidated" &&
    (message.reason === "login" ||
      message.reason === "signup" ||
      message.reason === "tenant-change")
  );
}
