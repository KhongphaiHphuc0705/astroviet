import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { MarketingLayout } from "./index";

describe("MarketingLayout", () => {
  it("renders required landmarks (header, nav, main, footer)", () => {
    render(<MarketingLayout>Test Content</MarketingLayout>);

    // Check navigation (desktop and mobile)
    const navs = screen.getAllByRole("navigation", { hidden: true });
    expect(navs.length).toBeGreaterThan(0);
    expect(navs[0]?.getAttribute("aria-label")).toContain("Điều hướng chính");

    // Check main content
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main.id).toBe("main-content");
    expect(main).toHaveTextContent("Test Content");

    // Check footer
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });
});
