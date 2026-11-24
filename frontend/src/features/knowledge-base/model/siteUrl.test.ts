// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEV_SITE_URL,
  parseStrictFlag,
  resolveSiteUrl,
  resolveSiteUrlDetailed,
  resolveSiteUrlForBuild,
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

describe("parseStrictFlag (KB-U24, D-F6-P4b, D-F6.5-03)", () => {
  it("should parse unset, empty, false, and 0 as false", () => {
    expect(parseStrictFlag(undefined)).toEqual({ value: false });
    expect(parseStrictFlag("")).toEqual({ value: false });
    expect(parseStrictFlag("   ")).toEqual({ value: false });
    expect(parseStrictFlag("false")).toEqual({ value: false });
    expect(parseStrictFlag("FALSE")).toEqual({ value: false });
    expect(parseStrictFlag(" 0 ")).toEqual({ value: false });
  });

  it("should parse true and 1 (case-insensitive) as true", () => {
    expect(parseStrictFlag("true")).toEqual({ value: true });
    expect(parseStrictFlag("TRUE")).toEqual({ value: true });
    expect(parseStrictFlag(" True ")).toEqual({ value: true });
    expect(parseStrictFlag("1")).toEqual({ value: true });
    expect(parseStrictFlag(" 1 ")).toEqual({ value: true });
  });

  it("should return an error for unexpected flag values to catch typos", () => {
    for (const raw of ["yes", "no", "on", "off", "2", "tru"]) {
      const result = parseStrictFlag(raw);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("PRERENDER_STRICT");
        expect(result.error).toContain(raw);
      }
    }
  });
});

describe("resolveSiteUrlForBuild (KB-U24, D-F6-P4/P4b, D-F6.5-02/03)", () => {
  it("should accept valid https origins and strip trailing slashes in both strict and non-strict modes", () => {
    expect(
      resolveSiteUrlForBuild("https://astroviet.vn/", { strict: false }),
    ).toEqual({
      status: "ok",
      siteUrl: "https://astroviet.vn",
      source: "env",
      warnings: [],
    });

    expect(
      resolveSiteUrlForBuild("  https://app.astroviet.vn/  ", { strict: true }),
    ).toEqual({
      status: "ok",
      siteUrl: "https://app.astroviet.vn",
      source: "env",
      warnings: [],
    });
  });

  it("should allow http localhost in non-strict mode without dev-fallback warning", () => {
    expect(
      resolveSiteUrlForBuild("http://localhost:5173/", { strict: false }),
    ).toEqual({
      status: "ok",
      siteUrl: "http://localhost:5173",
      source: "env",
      warnings: [],
    });
  });

  it("should fall back to localhost with warning when missing in non-strict mode, and fail with MISSING in strict mode", () => {
    for (const missing of [undefined, "", "   "]) {
      const nonStrict = resolveSiteUrlForBuild(missing, { strict: false });
      expect(nonStrict.status).toBe("ok");
      if (nonStrict.status === "ok") {
        expect(nonStrict.siteUrl).toBe(DEFAULT_DEV_SITE_URL);
        expect(nonStrict.source).toBe("dev-fallback");
        expect(nonStrict.warnings.length).toBeGreaterThan(0);
        expect(nonStrict.warnings[0]).toContain("VITE_SITE_URL");
      }

      const strict = resolveSiteUrlForBuild(missing, { strict: true });
      expect(strict.status).toBe("error");
      if (strict.status === "error") {
        expect(strict.code).toBe("MISSING");
        expect(strict.message).toContain("VITE_SITE_URL");
        expect(strict.message).toContain("PRERENDER_STRICT=true");
      }
    }
  });

  it("should always fail with INVALID for malformed URLs, paths, queries, hashes, credentials, or bad schemes (even non-strict)", () => {
    const invalidInputs = [
      "not-a-url",
      "example.org",
      "https://example.org/knowledge",
      "https://example.org?utm=1",
      "https://example.org#top",
      "https://user:pass@example.org",
      "ftp://example.org",
      "javascript:alert(1)",
    ];

    for (const raw of invalidInputs) {
      for (const strict of [false, true]) {
        const res = resolveSiteUrlForBuild(raw, { strict });
        expect(res.status).toBe("error");
        if (res.status === "error") {
          expect(res.code).toBe("INVALID");
          expect(res.message).toContain("VITE_SITE_URL");
        }
      }
    }
  });

  it("should reject non-https URLs with NOT_HTTPS in strict mode", () => {
    const res = resolveSiteUrlForBuild("http://example.org", { strict: true });
    expect(res.status).toBe("error");
    if (res.status === "error") {
      expect(res.code).toBe("NOT_HTTPS");
      expect(res.message).toContain("https://");
    }
  });

  it("should reject localhost and loopback/private/local IPs with LOCAL_HOST in strict mode", () => {
    const localHosts = [
      "https://localhost",
      "https://localhost:5173",
      "https://app.localhost",
      "https://astro.local",
      "https://web.internal",
      "https://127.0.0.1",
      "https://127.0.0.1:8443",
      "https://10.0.0.5",
      "https://172.16.0.1",
      "https://172.31.255.254",
      "https://192.168.1.10",
      "https://169.254.169.254",
      "https://100.64.0.1",
      "https://0.0.0.0",
      "https://[::1]",
      "https://[::]",
      "https://[::ffff:127.0.0.1]",
      "https://[fe80::1]",
      "https://[fd00::1]",
    ];

    for (const raw of localHosts) {
      const res = resolveSiteUrlForBuild(raw, { strict: true });
      expect(res.status, `Expected ${raw} to fail in strict mode`).toBe(
        "error",
      );
      if (res.status === "error") {
        expect(res.code, `Expected LOCAL_HOST for ${raw}`).toBe("LOCAL_HOST");
      }
    }

    // Non-private IP outside 172.16.0.0/12 should pass host check
    expect(
      resolveSiteUrlForBuild("https://172.32.0.1", { strict: true }).status,
    ).toBe("ok");
  });

  it("should reject RFC 2606 / RFC 6761 reserved & placeholder domains with RESERVED_HOST in strict mode", () => {
    const reservedHosts = [
      "https://astroviet.example",
      "https://astroviet.test",
      "https://astroviet.invalid",
      "https://sub.domain.example",
      "https://example.com",
      "https://www.example.com",
      "https://example.org",
      "https://sub.example.org",
      "https://example.net",
      "https://sub.example.net",
    ];

    for (const raw of reservedHosts) {
      const res = resolveSiteUrlForBuild(raw, { strict: true });
      expect(res.status, `Expected ${raw} to fail in strict mode`).toBe(
        "error",
      );
      if (res.status === "error") {
        expect(res.code, `Expected RESERVED_HOST for ${raw}`).toBe(
          "RESERVED_HOST",
        );
      }
    }
  });
});
