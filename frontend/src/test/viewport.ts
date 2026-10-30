import { installMatchMedia, type MatchMediaController } from "./matchMedia";

export interface ViewportController {
  setWidth: (widthPx: number) => void;
  getWidth: () => number;
  restore: () => void;
}

/**
 * Parses and evaluates a media query string against a simulated viewport width in pixels.
 * Supports:
 * - (min-width: Npx)
 * - (max-width: Npx)
 * - Compound queries with 'and'
 * - Comma-separated query lists (OR)
 */
export function evaluateMediaQueryForWidth(
  query: string,
  widthPx: number,
): boolean {
  const clauses = query.split(",").map((c) => c.trim());
  return clauses.some((clause) => evaluateClause(clause, widthPx));
}

function evaluateClause(clause: string, widthPx: number): boolean {
  const minWidthRegex = /\(\s*min-width\s*:\s*(\d+(?:\.\d+)?)\s*px\s*\)/gi;
  const maxWidthRegex = /\(\s*max-width\s*:\s*(\d+(?:\.\d+)?)\s*px\s*\)/gi;

  let hasWidthConstraint = false;
  let matches = true;

  let minMatch: RegExpExecArray | null;
  while ((minMatch = minWidthRegex.exec(clause)) !== null) {
    hasWidthConstraint = true;
    const minVal = parseFloat(minMatch[1] ?? "0");
    if (widthPx < minVal) {
      matches = false;
    }
  }

  let maxMatch: RegExpExecArray | null;
  while ((maxMatch = maxWidthRegex.exec(clause)) !== null) {
    hasWidthConstraint = true;
    const maxVal = parseFloat(maxMatch[1] ?? "0");
    if (widthPx > maxVal) {
      matches = false;
    }
  }

  if (hasWidthConstraint) {
    return matches;
  }

  // Fallback for non-width queries (e.g. prefers-reduced-motion) -> default false
  return false;
}

/**
 * Installs a viewport width emulator wrapping `installMatchMedia`.
 * Tracks all queried media queries, dynamically evaluates them against simulated width,
 * and notifies active listeners when `setWidth(px)` crosses query boundaries.
 *
 * @param initialWidthPx Initial simulated viewport width in pixels (default 1024)
 * @returns ViewportController with setWidth, getWidth, and restore methods
 */
export function installViewport(
  initialWidthPx: number = 1024,
): ViewportController {
  let currentWidth = initialWidthPx;
  const trackedQueries = new Set<string>();

  const originalInnerWidth = window.innerWidth;
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: currentWidth,
  });

  const resolver = (query: string): boolean => {
    trackedQueries.add(query);
    return evaluateMediaQueryForWidth(query, currentWidth);
  };

  const matchMediaController: MatchMediaController =
    installMatchMedia(resolver);

  const activeMatchMedia = window.matchMedia;
  window.matchMedia = (query: string): MediaQueryList => {
    trackedQueries.add(query);
    return activeMatchMedia(query);
  };

  return {
    setWidth: (newWidth: number) => {
      currentWidth = newWidth;
      window.innerWidth = newWidth;
      for (const query of Array.from(trackedQueries)) {
        const matches = evaluateMediaQueryForWidth(query, currentWidth);
        matchMediaController.setMatches(query, matches);
      }
      window.dispatchEvent(new Event("resize"));
    },
    getWidth: () => currentWidth,
    restore: () => {
      matchMediaController.restore();
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
      trackedQueries.clear();
    },
  };
}
