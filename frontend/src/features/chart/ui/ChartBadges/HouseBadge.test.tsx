import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { HouseBadge, ROMAN_HOUSE_NUMERALS } from "./HouseBadge";

describe("HouseBadge (nhóm B6)", () => {
  it("B6: renders arabic numerals by default with accessible screen reader text", () => {
    for (let h = 1; h <= 12; h++) {
      const { unmount } = render(<HouseBadge house={h} />);
      expect(screen.getByText(String(h))).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(screen.getByText(`Nhà thứ ${h}`)).toHaveClass("sr-only");
      unmount();
    }
  });

  it("B6: renders roman numerals when numeralStyle='roman'", () => {
    for (let h = 1; h <= 12; h++) {
      const { unmount } = render(<HouseBadge house={h} numeralStyle="roman" />);
      const expectedRoman = ROMAN_HOUSE_NUMERALS[h - 1]!;
      expect(screen.getByText(expectedRoman)).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(screen.getByText(`Nhà thứ ${h}`)).toHaveClass("sr-only");
      unmount();
    }
  });

  it("supports custom ariaLabel prop", () => {
    render(<HouseBadge house={5} ariaLabel="Nhà 5 (Sáng tạo)" />);
    expect(screen.getByText("Nhà 5 (Sáng tạo)")).toHaveClass("sr-only");
  });

  it("renders '—' and fallback accessible label for out of range house numbers", () => {
    const { rerender } = render(<HouseBadge house={0} />);
    expect(screen.getByText("—")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Không rõ nhà")).toHaveClass("sr-only");

    rerender(<HouseBadge house={13} />);
    expect(screen.getByText("—")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Không rõ nhà")).toHaveClass("sr-only");
  });

  it("passes axe accessibility checks", async () => {
    const { container } = render(
      <div>
        <HouseBadge house={1} />
        <HouseBadge house={10} numeralStyle="roman" />
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
