import { describe, expect, it } from "vitest";

import { createSafeRedirectUrl } from "./redirect-url";

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
