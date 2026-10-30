import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { SkipLink } from "./index";

describe("SkipLink (M9.3: SK1, SK2)", () => {
  it("SK1: renders with default Vietnamese label and links to #main-content", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", {
      name: "Chuyển đến nội dung chính",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#main-content");
    expect(link).toHaveClass("sr-only", "focus:not-sr-only");
  });

  it("SK2: supports custom href, children label, and custom class names", () => {
    render(
      <SkipLink href="#chart-data-tables" className="focus:fixed">
        Chuyển tới bảng dữ liệu
      </SkipLink>,
    );
    const link = screen.getByRole("link", {
      name: "Chuyển tới bảng dữ liệu",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#chart-data-tables");
    expect(link).toHaveClass("focus:fixed");
  });

  it("passes axe accessibility audit", async () => {
    const { container } = render(<SkipLink />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
