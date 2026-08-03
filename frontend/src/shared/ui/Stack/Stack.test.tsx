import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Stack } from "./index";

describe("Stack", () => {
  it("renders defaults correctly", () => {
    const { container } = render(<Stack>Test</Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex");
    expect(el.className).toContain("flex-col"); // default direction
    expect(el.tagName).toBe("DIV");
  });

  it("applies simple string props", () => {
    const { container } = render(
      <Stack
        direction="horizontal"
        gap="4"
        align="center"
        justify="between"
        wrap
      >
        Test
      </Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-row");
    expect(el.className).toContain("gap-4");
    expect(el.className).toContain("items-center");
    expect(el.className).toContain("justify-between");
    expect(el.className).toContain("flex-wrap");
  });

  it("applies responsive object props", () => {
    const { container } = render(
      <Stack
        direction={{ xs: "vertical", md: "horizontal" }}
        gap={{ xs: "2", lg: "8" }}
      >
        Test
      </Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-col");
    expect(el.className).toContain("md:flex-row");
    expect(el.className).toContain("lg:gap-8");
  });
});
