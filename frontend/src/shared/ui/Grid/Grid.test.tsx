import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Grid } from "./index";

describe("Grid", () => {
  it("renders default grid correctly", () => {
    const { container } = render(<Grid columns="2">Test</Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("grid");
    expect(el.className).toContain("grid-cols-2");
  });

  it("renders responsive columns", () => {
    const { container } = render(
      <Grid columns={{ xs: "1", md: "3" }} gap="4">
        Test
      </Grid>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("grid-cols-1");
    expect(el.className).toContain("md:grid-cols-3");
    expect(el.className).toContain("gap-4");
  });

  it("renders auto-fit columns via inline style", () => {
    const { container } = render(
      <Grid columns="auto-fit" minItemWidth="250px">
        Test
      </Grid>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("grid");
    expect(el.className).not.toContain("grid-cols");
    expect(el.style.gridTemplateColumns).toBe(
      "repeat(auto-fit, minmax(250px, 1fr))",
    );
  });

  it("applies explicit gaps", () => {
    const { container } = render(
      <Grid columns="2" columnGap="4" rowGap="8">
        Test
      </Grid>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("col-gap-4");
    expect(el.className).toContain("row-gap-8");
  });
});
