import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { KNOWN_ASPECT_TYPES } from "../../api/types";
import { resolveAspectNature, resolveAspectType } from "../../model/labels";

import { AspectBadge } from "./AspectBadge";

describe("AspectBadge (nhóm B7, B8)", () => {
  it("B7: renders all 5 standard aspect types with glyph and label", () => {
    const nature = resolveAspectNature("Harmonious");

    for (const typeName of KNOWN_ASPECT_TYPES) {
      const type = resolveAspectType(typeName);
      const { unmount } = render(<AspectBadge type={type} nature={nature} />);

      expect(screen.getByText(type.labelVi)).toBeInTheDocument();
      if (type.glyph) {
        expect(screen.getByText(type.glyph)).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      }
      expect(screen.getByText(", hài hòa")).toHaveClass("sr-only");
      unmount();
    }
  });

  it("B7: handles all aspect nature tones correctly", () => {
    const trine = resolveAspectType("Trine");
    const square = resolveAspectType("Square");
    const conjunction = resolveAspectType("Conjunction");
    const unknownNature = resolveAspectNature("CustomTone");

    const { rerender } = render(
      <AspectBadge type={trine} nature={resolveAspectNature("Harmonious")} />,
    );
    expect(screen.getByText("Tam hợp").closest("[data-tone]")).toHaveAttribute(
      "data-tone",
      "harmonious",
    );

    rerender(
      <AspectBadge type={square} nature={resolveAspectNature("Challenging")} />,
    );
    expect(
      screen.getByText("Vuông chiếu").closest("[data-tone]"),
    ).toHaveAttribute("data-tone", "tense");
    expect(screen.getByText(", căng thẳng")).toHaveClass("sr-only");

    rerender(
      <AspectBadge
        type={conjunction}
        nature={resolveAspectNature("Neutral")}
      />,
    );
    expect(screen.getByText("Hợp").closest("[data-tone]")).toHaveAttribute(
      "data-tone",
      "neutral",
    );

    // Unknown tone fallback
    rerender(<AspectBadge type={trine} nature={unknownNature} />);
    expect(screen.getByText("Tam hợp").closest("[data-tone]")).toHaveAttribute(
      "data-tone",
      "unknown",
    );
  });

  it("renders role='img' and aria-label when showLabel=false", () => {
    const opposition = resolveAspectType("Opposition");
    const challenging = resolveAspectNature("Challenging");

    render(
      <AspectBadge type={opposition} nature={challenging} showLabel={false} />,
    );

    const img = screen.getByRole("img", { name: "Đối xung, căng thẳng" });
    expect(img).toBeInTheDocument();
  });

  it("passes axe accessibility checks", async () => {
    const square = resolveAspectType("Square");
    const challenging = resolveAspectNature("Challenging");
    const { container } = render(
      <AspectBadge type={square} nature={challenging} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
