import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { KNOWN_ZODIAC_SIGNS } from "../../api/types";
import { resolveSign } from "../../model/labels";

import { SignGlyph } from "./SignGlyph";

describe("SignGlyph (nhóm B5, B8)", () => {
  it("B5: renders all 12 zodiac signs with text variation selector \\uFE0E in glyph", () => {
    for (const signName of KNOWN_ZODIAC_SIGNS) {
      const sign = resolveSign(signName);
      const { unmount } = render(<SignGlyph sign={sign} />);

      expect(screen.getByText(sign.labelVi)).toBeInTheDocument();
      expect(sign.glyph).toContain("\uFE0E");
      expect(screen.getByText(sign.glyph!)).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      unmount();
    }
  });

  it("renders role='img' and aria-label when showLabel=false", () => {
    const aries = resolveSign("Aries");
    render(<SignGlyph sign={aries} showLabel={false} />);

    const img = screen.getByRole("img", { name: "Bạch Dương" });
    expect(img).toBeInTheDocument();
    expect(screen.queryByText("Bạch Dương")).not.toBeInTheDocument();
  });

  it("renders fallback label without glyph when sign is unknown", () => {
    const unknownSign = resolveSign("Ophiuchus");
    render(<SignGlyph sign={unknownSign} />);

    expect(screen.getByText("Ophiuchus")).toBeInTheDocument();
  });

  it("passes axe accessibility checks", async () => {
    const scorpio = resolveSign("Scorpio");
    const { container } = render(<SignGlyph sign={scorpio} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
