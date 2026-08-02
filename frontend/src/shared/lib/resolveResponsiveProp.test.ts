import { describe, it, expect } from "vitest";

import { resolveResponsiveProp } from "./resolveResponsiveProp";

const mockMapping = {
  base: { a: "class-a", b: "class-b" },
  md: { a: "md:class-a", b: "md:class-b" },
};

describe("resolveResponsiveProp", () => {
  it("handles single value", () => {
    expect(resolveResponsiveProp("a", mockMapping)).toBe("class-a");
  });

  it("handles responsive object with xs", () => {
    expect(resolveResponsiveProp({ xs: "a", md: "b" }, mockMapping)).toBe(
      "class-a md:class-b",
    );
  });

  it("handles undefined gracefully", () => {
    expect(resolveResponsiveProp(undefined, mockMapping)).toBe("");
  });

  it("ignores missing breakpoints in mapping", () => {
    // 'lg' is not in mockMapping, should just filter it out
    expect(resolveResponsiveProp({ lg: "a" }, mockMapping)).toBe("");
  });
});
