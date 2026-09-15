type RefreshHandler<T = unknown> = () => Promise<T>;

let handler: RefreshHandler | null = null;
let inFlight: Promise<unknown> | null = null;

export function setRefreshHandler<T>(newHandler: RefreshHandler<T>): void {
  handler = newHandler as RefreshHandler;
}

export function coordinateRefresh<T = unknown>(): Promise<T> {
  if (inFlight) {
    return inFlight as Promise<T>;
  }
  if (!handler) {
    return Promise.reject(
      new Error("[auth-refresh-coordinator] No refresh handler registered."),
    );
  }
  const promise = handler().finally(() => {
    inFlight = null;
  });
  inFlight = promise;
  return promise as Promise<T>;
}

// Chỉ dùng trong test — reset module-level singleton state giữa các test file
export function __resetRefreshCoordinatorForTests(): void {
  handler = null;
  inFlight = null;
}
