import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { KNOWN_PLANET_NAMES } from "../../api/types";
import { resolvePlanet } from "../../model/labels";

import { PlanetGlyph } from "./PlanetGlyph";

describe("PlanetGlyph (nhóm B1..B4, B8)", () => {
  it("B1: renders Vietnamese labels correctly for core planets", () => {
    for (const name of KNOWN_PLANET_NAMES) {
      const planet = resolvePlanet(name);
      const { unmount } = render(<PlanetGlyph planet={planet} />);
      expect(screen.getByText(planet.labelVi)).toBeInTheDocument();
      unmount();
    }
  });

  it("B2: renders ℞ glyph and accessible text when retrograde=true", () => {
    const mercury = resolvePlanet("Mercury");
    render(<PlanetGlyph planet={mercury} retrograde />);

    expect(screen.getByText("Sao Thủy")).toBeInTheDocument();
    expect(screen.getByText("℞")).toBeInTheDocument();
    expect(screen.getByText(", nghịch hành")).toHaveClass("sr-only");
  });

  it("B3: renders role='img' and aria-label when showLabel=false", () => {
    const pluto = resolvePlanet("Pluto");
    const { rerender } = render(
      <PlanetGlyph planet={pluto} showLabel={false} />,
    );

    const img = screen.getByRole("img", { name: "Sao Diêm Vương" });
    expect(img).toBeInTheDocument();
    expect(screen.queryByText("Sao Diêm Vương")).not.toBeInTheDocument();

    // With retrograde
    rerender(<PlanetGlyph planet={pluto} showLabel={false} retrograde />);
    expect(
      screen.getByRole("img", { name: "Sao Diêm Vương, nghịch hành" }),
    ).toBeInTheDocument();
  });

  it("B4: renders fallback label without glyph when planet is unknown", () => {
    const unknownPlanet = resolvePlanet("CustomAsteroid");
    render(<PlanetGlyph planet={unknownPlanet} />);

    expect(screen.getByText("CustomAsteroid")).toBeInTheDocument();
  });

  it("B8: glyph is hidden from screen readers via aria-hidden='true'", () => {
    const sun = resolvePlanet("Sun");
    render(<PlanetGlyph planet={sun} />);

    const glyphEl = screen.getByText(sun.glyph!);
    expect(glyphEl).toHaveAttribute("aria-hidden", "true");
  });

  it("passes axe accessibility checks", async () => {
    const mars = resolvePlanet("Mars");
    const { container } = render(<PlanetGlyph planet={mars} retrograde />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
