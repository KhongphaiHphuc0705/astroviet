import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { chartAllAspects } from "../../api/mocks/fixtures";
import { buildAspectGeometry } from "../../model/aspectGeometry";
import { toChartViewModel } from "../../model/chartViewModel";

import { AspectLegend } from "./AspectLegend";

describe("AspectLegend (L1 - L4)", () => {
  const allAspectsVM = toChartViewModel(chartAllAspects);
  const allAspectsGeom = buildAspectGeometry(
    allAspectsVM.aspects,
    allAspectsVM.planets,
    allAspectsVM.flags.ascendantLongitude ?? 0,
  );

  it("L1: renders exact count of items matching legend entries, with type and nature labels", () => {
    render(<AspectLegend legend={allAspectsGeom.legend} />);

    const list = screen.getByRole("list", {
      name: "Chú giải kiểu đường góc chiếu",
    });
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(allAspectsGeom.legend.length);
    expect(allAspectsGeom.legend.length).toBe(5); // all 5 aspect types in chartAllAspects

    // Verify content of first entry (Conjunction)
    expect(
      screen.getByText(/Hợp \(Trung tính\) — Cung liền, dày/),
    ).toBeInTheDocument();
    // Verify Square (Challenging)
    expect(
      screen.getByText(/Vuông chiếu \(Căng thẳng\) — Nét đứt, vừa/),
    ).toBeInTheDocument();
  });

  it("L2: provides semantic accessible name on list and hides preview SVG with aria-hidden", () => {
    const { container } = render(
      <AspectLegend legend={allAspectsGeom.legend} />,
    );

    const list = container.querySelector(
      'ul[aria-label="Chú giải kiểu đường góc chiếu"]',
    );
    expect(list).toBeInTheDocument();

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(allAspectsGeom.legend.length);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("L3: returns null and renders nothing when legend is empty", () => {
    const { container } = render(<AspectLegend legend={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("L4: passes vitest-axe accessibility audit without violations", async () => {
    const { container } = render(
      <AspectLegend legend={allAspectsGeom.legend} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
