// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEV_SITE_URL,
  resolveSiteUrl,
  resolveSiteUrlDetailed,
} from "./siteUrl";

describe("resolveSiteUrl (KB-U51, D-F6.4-01, AC-F6.4-A06)", () => {
  it("should normalize valid site URLs and strip trailing slashes in both dev and production", () => {
    expect(resolveSiteUrl("https://astroviet.com/", { isDev: false })).toBe(
      "https://astroviet.com",
    );
    expect(resolveSiteUrl("  https://astroviet.com  ", { isDev: false })).toBe(
      "https://astroviet.com",
    );
    expect(resolveSiteUrl("http://localhost:5173/", { isDev: true })).toBe(
      "http://localhost:5173",
    );
  });

  it("should fall back to localhost in dev when VITE_SITE_URL is missing or empty", () => {
    expect(resolveSiteUrl(undefined, { isDev: true })).toBe(
      DEFAULT_DEV_SITE_URL,
    );
    expect(resolveSiteUrl("", { isDev: true })).toBe(DEFAULT_DEV_SITE_URL);
    expect(resolveSiteUrl("   ", { isDev: true })).toBe(DEFAULT_DEV_SITE_URL);
  });

  it("should return undefined without guessing a domain in production when VITE_SITE_URL is missing", () => {
    expect(resolveSiteUrl(undefined, { isDev: false })).toBeUndefined();
    expect(resolveSiteUrl("", { isDev: false })).toBeUndefined();
    expect(resolveSiteUrlDetailed(undefined, { isDev: false })).toEqual({
      siteUrl: undefined,
    });
  });

  it("should reject malformed URLs, sub-paths, query strings, hashes, and unsupported schemes", () => {
    const invalidInputs = [
      "not-a-url",
      "astroviet.com",
      "https://astroviet.com/subpath",
      "https://astroviet.com?foo=bar",
      "https://astroviet.com#hash",
      "ftp://astroviet.com",
      "javascript:alert(1)",
    ];

    for (const raw of invalidInputs) {
      expect(resolveSiteUrl(raw, { isDev: true })).toBeUndefined();
      expect(resolveSiteUrl(raw, { isDev: false })).toBeUndefined();

      const detailed = resolveSiteUrlDetailed(raw, { isDev: false });
      expect(detailed.siteUrl).toBeUndefined();
      expect(detailed.invalidError).toBeInstanceOf(Error);
    }
  });
});
