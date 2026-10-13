import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { ChartViewerSkeleton } from "./ChartViewerSkeleton";

describe("ChartViewerSkeleton", () => {
  it("renders with role='status' and aria-busy='true'", () => {
    render(<ChartViewerSkeleton />);

    const container = screen.getByRole("status");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-busy", "true");
  });

  it("contains screen-reader announcement text", () => {
    render(<ChartViewerSkeleton />);

    expect(screen.getByText("Đang tải lá số…")).toBeInTheDocument();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(<ChartViewerSkeleton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
