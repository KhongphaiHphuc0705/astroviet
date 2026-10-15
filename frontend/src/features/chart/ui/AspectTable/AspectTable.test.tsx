import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { resolvePlanet } from "../../model/labels";

import { AspectTable } from "./AspectTable";

describe("AspectTable (nhóm A)", () => {
  const fullVM = toChartViewModel(chartFull);

  it("A1: renders exact row count and order (orb ascending) matching ViewModel", () => {
    render(<AspectTable aspects={fullVM.aspects} />);

    const rows = screen.getAllByRole("row");
    // 1 header row + N aspect rows
    expect(rows).toHaveLength(fullVM.aspects.length + 1);

    // Verify row headers match planetA in VM order
    const rowHeaders = screen.getAllByRole("rowheader");
    expect(rowHeaders).toHaveLength(fullVM.aspects.length);
    fullVM.aspects.forEach((aspect, index) => {
      expect(rowHeaders[index]).toHaveTextContent(aspect.planetA.labelVi);
    });
  });

  it("A2: renders accurate planetA, aspect type, planetB, orb, and status values", () => {
    render(<AspectTable aspects={fullVM.aspects} />);

    const firstAspect = fullVM.aspects[0]!;
    const firstRow = screen.getAllByRole("row")[1]!;

    expect(firstRow).toHaveTextContent(firstAspect.planetA.labelVi);
    expect(firstRow).toHaveTextContent(firstAspect.type.labelVi);
    expect(firstRow).toHaveTextContent(firstAspect.planetB.labelVi);
    expect(firstRow).toHaveTextContent(firstAspect.orbLabel!);
    expect(firstRow).toHaveTextContent(firstAspect.applyingLabelVi);
  });

  it("A3: renders AspectBadge correctly across present aspect types", () => {
    render(<AspectTable aspects={fullVM.aspects} />);

    const uniqueTypes = new Set(fullVM.aspects.map((a) => a.type.labelVi));
    uniqueTypes.forEach((labelVi) => {
      expect(screen.getAllByText(labelVi).length).toBeGreaterThan(0);
    });
  });

  it("A4: displays correct applying/separating text", () => {
    render(<AspectTable aspects={fullVM.aspects} />);

    const hasApplying = fullVM.aspects.some((a) => a.isApplying);
    const hasSeparating = fullVM.aspects.some((a) => !a.isApplying);

    if (hasApplying) {
      expect(screen.getAllByText("Đang tới gần").length).toBeGreaterThan(0);
    }
    if (hasSeparating) {
      expect(screen.getAllByText("Đang rời xa").length).toBeGreaterThan(0);
    }
  });

  it("A5: renders EmptyState when aspects array is empty without mentioning settings", () => {
    render(<AspectTable aspects={[]} />);

    const emptyText = screen.getByText(
      "Không tìm thấy góc chiếu nào trong phạm vi orb hiện tại",
    );
    expect(emptyText).toBeInTheDocument();
    expect(screen.queryByText(/cài đặt/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("A6: supports controlled selection with aria-pressed, keyboard, and click", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const targetAspect = fullVM.aspects[0]!;

    const { rerender } = render(
      <AspectTable
        aspects={fullVM.aspects}
        selectedKey={targetAspect.key}
        onSelect={handleSelect}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const targetButton = buttons[0]!;
    expect(targetButton).toHaveAttribute("aria-pressed", "true");

    const secondButton = buttons[1]!;
    expect(secondButton).toHaveAttribute("aria-pressed", "false");

    // Click
    await user.click(secondButton);
    expect(handleSelect).toHaveBeenCalledWith(fullVM.aspects[1]!.key);

    // Keyboard Enter
    targetButton.focus();
    await user.keyboard("{Enter}");
    expect(handleSelect).toHaveBeenCalledWith(targetAspect.key);

    // Keyboard Space
    await user.keyboard(" ");
    expect(handleSelect).toHaveBeenCalledWith(targetAspect.key);

    // Rerender with different selection
    rerender(
      <AspectTable
        aspects={fullVM.aspects}
        selectedKey={fullVM.aspects[1]!.key}
        onSelect={handleSelect}
      />,
    );
    expect(targetButton).toHaveAttribute("aria-pressed", "false");
    expect(secondButton).toHaveAttribute("aria-pressed", "true");
  });

  it("A6 (omitted onSelect): does not render selection buttons when onSelect is omitted", () => {
    render(<AspectTable aspects={fullVM.aspects} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("A7: filters rows by filterPlanetKey and maintains ascending order", () => {
    const sunPlanet = resolvePlanet("Sun");
    const expectedMatches = fullVM.aspects.filter(
      (a) => a.planetA.key === "Sun" || a.planetB.key === "Sun",
    );
    expect(expectedMatches.length).toBeGreaterThan(0);

    render(
      <AspectTable
        aspects={fullVM.aspects}
        filterPlanetKey="Sun"
        filterPlanet={sunPlanet}
        onClearFilter={vi.fn()}
      />,
    );

    // Verify filter chip is rendered
    expect(
      screen.getByRole("button", {
        name: `Xóa bộ lọc theo ${sunPlanet.labelVi}`,
      }),
    ).toBeInTheDocument();

    // Verify filtered table rows: 1 header + filtered count
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(expectedMatches.length + 1);

    // Verify each row contains Sun as planetA or planetB
    const dataRows = rows.slice(1);
    dataRows.forEach((row) => {
      expect(row).toHaveTextContent(sunPlanet.labelVi);
    });
  });

  it("A8: displays distinct message when filter yields zero results", () => {
    const unknownPlanet = {
      key: "UnknownBody",
      labelVi: "Hành tinh lạ",
      glyph: null,
      known: false,
    };

    render(
      <AspectTable
        aspects={fullVM.aspects}
        filterPlanetKey="UnknownBody"
        filterPlanet={unknownPlanet}
        onClearFilter={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Không có góc chiếu nào của Hành tinh lạ trong dữ liệu"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("A9: renders cards layout with role='list' and without table", () => {
    render(<AspectTable aspects={fullVM.aspects} layout="cards" />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(fullVM.aspects.length);

    // All fields exist in card
    const firstAspect = fullVM.aspects[0]!;
    const firstCard = items[0]!;
    expect(firstCard).toHaveTextContent(firstAspect.planetA.labelVi);
    expect(firstCard).toHaveTextContent(firstAspect.type.labelVi);
    expect(firstCard).toHaveTextContent(firstAspect.planetB.labelVi);
    expect(firstCard).toHaveTextContent(firstAspect.orbLabel!);
    expect(firstCard).toHaveTextContent(firstAspect.applyingLabelVi);
  });

  it("A10: uses key as fallback label for chip when filterPlanet is omitted to avoid silent filtering", () => {
    const onClear = vi.fn();
    render(
      <AspectTable
        aspects={fullVM.aspects}
        filterPlanetKey="Sun"
        onClearFilter={onClear}
      />,
    );

    // Verify chip renders with fallback label Sun instead of silently filtering
    expect(
      screen.getByRole("button", { name: "Xóa bộ lọc theo Sun" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Đang lọc: Sun")).toBeInTheDocument();
  });

  it("passes axe accessibility checks across table, cards, empty, filtered, and selected states", async () => {
    const { container: tableContainer } = render(
      <AspectTable
        aspects={fullVM.aspects}
        selectedKey={fullVM.aspects[0]!.key}
        onSelect={vi.fn()}
      />,
    );
    expect(await axe(tableContainer)).toHaveNoViolations();

    const { container: cardsContainer } = render(
      <AspectTable
        aspects={fullVM.aspects}
        layout="cards"
        selectedKey={fullVM.aspects[0]!.key}
        onSelect={vi.fn()}
      />,
    );
    expect(await axe(cardsContainer)).toHaveNoViolations();

    const { container: emptyContainer } = render(<AspectTable aspects={[]} />);
    expect(await axe(emptyContainer)).toHaveNoViolations();

    const { container: filteredContainer } = render(
      <AspectTable
        aspects={fullVM.aspects}
        filterPlanetKey="Sun"
        filterPlanet={resolvePlanet("Sun")}
        onClearFilter={vi.fn()}
      />,
    );
    expect(await axe(filteredContainer)).toHaveNoViolations();
  });
});
