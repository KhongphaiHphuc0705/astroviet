export interface MatchMediaController {
  setMatches: (query: string, matches: boolean) => void;
  restore: () => void;
}

/**
 * Installs a controllable window.matchMedia mock for Vitest integration tests.
 * Supports addEventListener/removeEventListener, addListener/removeListener,
 * and dispatching real change events when setMatches is called.
 *
 * @param initialMatches Boolean value or resolver function (query: string) => boolean
 * @returns MatchMediaController with setMatches and restore methods
 */
export function installMatchMedia(
  initialMatches?: boolean | ((query: string) => boolean),
): MatchMediaController {
  const originalMatchMedia = window.matchMedia;

  const queryStateMap = new Map<
    string,
    {
      matches: boolean;
      listeners: Set<(e: MediaQueryListEvent) => void>;
    }
  >();

  function getQueryState(query: string) {
    let state = queryStateMap.get(query);
    if (!state) {
      const matches =
        typeof initialMatches === "function"
          ? initialMatches(query)
          : typeof initialMatches === "boolean"
            ? initialMatches
            : false;
      state = {
        matches,
        listeners: new Set(),
      };
      queryStateMap.set(query, state);
    }
    return state;
  }

  const customMatchMedia = (query: string): MediaQueryList => {
    const state = getQueryState(query);

    const mql: MediaQueryList = {
      get matches() {
        return state.matches;
      },
      media: query,
      onchange: null,
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (type === "change" && typeof listener === "function") {
          state.listeners.add(listener as (e: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (type === "change" && typeof listener === "function") {
          state.listeners.delete(listener as (e: MediaQueryListEvent) => void);
        }
      },
      addListener: (
        listener:
          ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
      ) => {
        if (typeof listener === "function") {
          state.listeners.add(listener);
        }
      },
      removeListener: (
        listener:
          ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
      ) => {
        if (typeof listener === "function") {
          state.listeners.delete(listener);
        }
      },
      dispatchEvent: (event: Event) => {
        if (event.type === "change") {
          for (const listener of state.listeners) {
            listener(event as unknown as MediaQueryListEvent);
          }
          return true;
        }
        return false;
      },
    };

    return mql;
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: customMatchMedia,
  });

  return {
    setMatches: (query: string, matches: boolean) => {
      const state = getQueryState(query);
      if (state.matches !== matches) {
        state.matches = matches;
        const event = {
          matches,
          media: query,
        } as unknown as MediaQueryListEvent;
        for (const listener of Array.from(state.listeners)) {
          listener(event);
        }
      }
    },
    restore: () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: originalMatchMedia,
      });
      queryStateMap.clear();
    },
  };
}
