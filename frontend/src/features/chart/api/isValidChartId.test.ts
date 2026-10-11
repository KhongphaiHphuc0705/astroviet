import { describe, expect, it } from "vitest";

import { isValidChartId } from "./isValidChartId";

describe("isValidChartId", () => {
  it("returns true for a valid UUID", () => {
    expect(isValidChartId("5d24bbf6-ef0d-47fc-9c02-a1c8ca5e08a4")).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(isValidChartId(undefined)).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isValidChartId("")).toBe(false);
  });

  it('returns false for "123"', () => {
    expect(isValidChartId("123")).toBe(false);
  });

  it("returns false for a UUID with missing dashes", () => {
    expect(isValidChartId("5d24bbf6ef0d47fc9c02a1c8ca5e08a4")).toBe(false);
  });

  it("returns false for a UUID with invalid characters", () => {
    expect(isValidChartId("5d24bbf6-ef0d-47fc-9c02-z1c8ca5e08a4")).toBe(false);
  });
});
