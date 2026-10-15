import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { installMatchMedia } from "@test/matchMedia";

import { useMediaQuery } from "./useMediaQuery";

describe("useMediaQuery (M7-U1..U6)", () => {
  let controller: ReturnType<typeof installMatchMedia> | null = null;

  afterEach(() => {
    if (controller) {
      controller.restore();
      controller = null;
    }
  });

  it("M7-U1: returns initial true/false correctly based on matching state", () => {
    controller = installMatchMedia((query) => query === "(min-width: 640px)");

    const { result: matchedResult } = renderHook(() =>
      useMediaQuery("(min-width: 640px)"),
    );
    expect(matchedResult.current).toBe(true);

    const { result: unmatchedResult } = renderHook(() =>
      useMediaQuery("(min-width: 1024px)"),
    );
    expect(unmatchedResult.current).toBe(false);
  });

  it("M7-U2: updates value and re-renders when matchMedia fires change event", () => {
    controller = installMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));
    expect(result.current).toBe(false);

    act(() => {
      controller?.setMatches("(min-width: 640px)", true);
    });

    expect(result.current).toBe(true);

    act(() => {
      controller?.setMatches("(min-width: 640px)", false);
    });

    expect(result.current).toBe(false);
  });

  it("M7-U3: cleans up change event listener on component unmount", () => {
    controller = installMatchMedia(false);
    const removeEventListenerSpy = vi.fn();

    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => {
      const mql = originalMatchMedia(query);
      const originalRemove = mql.removeEventListener.bind(mql);
      mql.removeEventListener = (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        removeEventListenerSpy(type);
        originalRemove(type, listener);
      };
      return mql;
    });

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 640px)"));
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("change");
  });

  it("M7-U4: unbinds old query and subscribes to new query when query changes", () => {
    controller = installMatchMedia((query) => query === "(min-width: 1024px)");

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      {
        initialProps: { query: "(min-width: 640px)" },
      },
    );

    expect(result.current).toBe(false);

    // Switch to a query that matches
    rerender({ query: "(min-width: 1024px)" });
    expect(result.current).toBe(true);

    // Dynamic change on the new query
    act(() => {
      controller?.setMatches("(min-width: 1024px)", false);
    });
    expect(result.current).toBe(false);
  });

  it("M7-U5: safely returns false when window.matchMedia is undefined", () => {
    const originalMatchMedia = window.matchMedia;
    // Simulate environment without matchMedia
    // @ts-expect-error testing missing matchMedia
    delete window.matchMedia;

    try {
      const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));
      expect(result.current).toBe(false);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("M7-U6: test helper installMatchMedia dispatches real events and restore resets original", () => {
    const originalMatchMedia = window.matchMedia;
    controller = installMatchMedia(false);

    expect(window.matchMedia).not.toBe(originalMatchMedia);

    const mql = window.matchMedia("(min-width: 768px)");
    const changeHandler = vi.fn();
    mql.addEventListener("change", changeHandler);

    act(() => {
      controller?.setMatches("(min-width: 768px)", true);
    });

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        matches: true,
        media: "(min-width: 768px)",
      }),
    );

    controller.restore();
    controller = null;
    expect(window.matchMedia).toBe(originalMatchMedia);
  });
});
