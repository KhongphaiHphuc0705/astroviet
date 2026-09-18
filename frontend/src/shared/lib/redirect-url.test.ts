import { describe, expect, it } from "vitest";

import {
  createSafeRedirectUrl,
  getSafeRedirectDestination,
} from "./redirect-url";

describe("createSafeRedirectUrl", () => {
  it("creates a redirect url from a simple path", () => {
    expect(createSafeRedirectUrl("/app")).toBe("/login?redirect=%2Fapp");
  });

  it("includes search and hash parameters", () => {
    expect(
      createSafeRedirectUrl("/app/dashboard", "?filter=active", "#section"),
    ).toBe("/login?redirect=%2Fapp%2Fdashboard%3Ffilter%3Dactive%23section");
  });

  it("prevents open redirects by converting double slashes to single slashes", () => {
    expect(createSafeRedirectUrl("//evil.com")).toBe(
      "/login?redirect=%2Fevil.com",
    );
    expect(createSafeRedirectUrl("///evil.com")).toBe(
      "/login?redirect=%2Fevil.com",
    );
  });
});

describe("getSafeRedirectDestination", () => {
  it("returns fallback for null or empty string", () => {
    expect(getSafeRedirectDestination(null)).toBe("/app");
    expect(getSafeRedirectDestination("")).toBe("/app");
  });

  it("returns fallback for absolute urls", () => {
    expect(getSafeRedirectDestination("https://evil.com")).toBe("/app");
    expect(getSafeRedirectDestination("evil.com/app")).toBe("/app");
  });

  it("returns fallback for protocol-relative urls", () => {
    expect(getSafeRedirectDestination("//evil.com")).toBe("/app");
    expect(getSafeRedirectDestination("///evil.com")).toBe("/app");
  });

  it("returns the path if it is a valid relative path", () => {
    expect(getSafeRedirectDestination("/app/dashboard")).toBe("/app/dashboard");
    expect(getSafeRedirectDestination("/settings?a=1")).toBe("/settings?a=1");
  });
});
