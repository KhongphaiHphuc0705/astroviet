import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Section } from "./index";

describe("Section", () => {
  it("renders default section with container correctly", () => {
    const { container } = render(<Section>Test</Section>);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("SECTION");
    expect(el.className).toContain("py-16");

    const innerContainer = el.firstChild as HTMLElement;
    expect(innerContainer.tagName).toBe("DIV");
    expect(innerContainer.className).toContain("max-w-[1200px]"); // default container size
  });

  it("renders compact spacing and custom container size", () => {
    const { container } = render(
      <Section spacing="compact" containerSize="narrow">
        Test
      </Section>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("py-12");

    const innerContainer = el.firstChild as HTMLElement;
    expect(innerContainer.className).toContain("max-w-[768px]");
  });

  it("renders custom polymorphic element and ARIA labels", () => {
    const { container } = render(
      <Section as="article" aria-label="Knowledge Base">
        Test
      </Section>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("ARTICLE");
    expect(el.getAttribute("aria-label")).toBe("Knowledge Base");
  });
});
