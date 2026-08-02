import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Container } from "./index";

describe("Container", () => {
  it("renders default correctly", () => {
    const { container } = render(<Container>Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("max-w-[1200px]");
    expect(el.className).toContain("px-4");
    expect(el.className).toContain("md:px-8");
    expect(el.tagName).toBe("DIV");
  });

  it("renders different sizes", () => {
    const { container } = render(<Container size="narrow">Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("max-w-[768px]");
  });

  it("respects paddingX=false", () => {
    const { container } = render(<Container paddingX={false}>Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("px-4");
  });

  it("renders polymorphic as prop", () => {
    const { container } = render(
      <Container as="main" id="main-content">
        Test
      </Container>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("MAIN");
    expect(el.id).toBe("main-content");
  });
});
