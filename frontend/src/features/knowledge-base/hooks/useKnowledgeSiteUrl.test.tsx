import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as reportErrorModule from "@shared/lib/report-error";

import { DEFAULT_DEV_SITE_URL } from "../model/siteUrl";

import { useKnowledgeSiteUrl } from "./useKnowledgeSiteUrl";

describe("useKnowledgeSiteUrl (D-F6.4-01)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return normalized siteUrl without calling reportError when valid", () => {
    const reportSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useKnowledgeSiteUrl({
        rawSiteUrl: "https://astroviet.com/",
        isDev: false,
      }),
    );

    expect(result.current).toBe("https://astroviet.com");
    expect(reportSpy).not.toHaveBeenCalled();
  });

  it("should fall back to localhost in dev and undefined in production when omitted", () => {
    const devHook = renderHook(() =>
      useKnowledgeSiteUrl({ rawSiteUrl: undefined, isDev: true }),
    );
    expect(devHook.result.current).toBe(DEFAULT_DEV_SITE_URL);

    const prodHook = renderHook(() =>
      useKnowledgeSiteUrl({ rawSiteUrl: undefined, isDev: false }),
    );
    expect(prodHook.result.current).toBeUndefined();
  });

  it("should report invalid VITE_SITE_URL once and return undefined", () => {
    const reportSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    const { result, rerender } = renderHook(
      ({ raw }) => useKnowledgeSiteUrl({ rawSiteUrl: raw, isDev: false }),
      { initialProps: { raw: "invalid-url" } },
    );

    expect(result.current).toBeUndefined();
    expect(reportSpy).toHaveBeenCalledTimes(1);
    expect(reportSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "knowledge:invalid-site-url",
    );

    rerender({ raw: "invalid-url" });
    expect(reportSpy).toHaveBeenCalledTimes(1);
  });
});
