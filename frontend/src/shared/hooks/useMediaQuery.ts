import { useCallback, useSyncExternalStore } from "react";

/**
 * Hook subscribing to a CSS media query string using useSyncExternalStore.
 * Safe for SSR and environments without window.matchMedia (returns false).
 *
 * @param query CSS media query string, e.g. "(min-width: 640px)"
 * @returns boolean indicating whether the query currently matches
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function"
      ) {
        return () => {};
      }

      const mediaQueryList = window.matchMedia(query);
      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", callback);
        return () => {
          mediaQueryList.removeEventListener("change", callback);
        };
      } else if (
        typeof (
          mediaQueryList as unknown as {
            addListener?: (fn: () => void) => void;
          }
        ).addListener === "function"
      ) {
        mediaQueryList.addListener(callback);
        return () => {
          mediaQueryList.removeListener(callback);
        };
      }

      return () => {};
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
