import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";

import { HouseTable } from "./HouseTable";

describe("HouseTable", () => {
  const fullVM = toChartViewModel(chartFull);
  const noHousesVM = toChartViewModel(chartNoHouses);

  it("H1: renders exactly 12 house rows in numerical order from 1 to 12", () => {
    render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
      />,
    );

    // The house table is the first table
    const tables = screen.getAllByRole("table");
    expect(tables.length).toBeGreaterThanOrEqual(1);

    const houseTable = tables[0]!;
    // 1 header row + 12 house rows
    const rows = houseTable.querySelectorAll("tr");
    expect(rows).toHaveLength(13);

    // Verify row headers are ordered 1 to 12
    const rowHeaders = houseTable.querySelectorAll("th[scope='row']");
    expect(rowHeaders).toHaveLength(12);
    fullVM.houses.forEach((house, index) => {
      expect(rowHeaders[index]).toHaveTextContent(String(house.number));
    });
  });

  it("H2: renders accurate cusp degrees and sign glyphs for houses", () => {
    render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
      />,
    );

    const house1 = fullVM.houses.find((h) => h.number === 1)!;
    expect(house1).toBeDefined();

    const houseTable = screen.getAllByRole("table")[0]!;
    const house1Row = houseTable.querySelector("tbody tr")!;
    expect(house1Row).toHaveTextContent(house1.sign.labelVi);
    expect(house1Row).toHaveTextContent(house1.degreeLabel!);
  });

  it("H3: has accessible caption and proper scope attributes", () => {
    render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
      />,
    );

    const houseCaption = screen.getByText(
      new RegExp(
        `Nhà theo hệ ${fullVM.meta.houseSystem.labelVi} — Natal Chart, 12 hàng`,
      ),
    );
    expect(houseCaption).toHaveClass("sr-only");

    const houseTable = screen.getAllByRole("table")[0]!;
    const colHeaders = houseTable.querySelectorAll("th[scope='col']");
    expect(colHeaders).toHaveLength(3);

    const rowHeaders = houseTable.querySelectorAll("th[scope='row']");
    expect(rowHeaders).toHaveLength(12);
  });

  it("H4: omits house table and renders unavailableContent when houseDataAvailable is false", () => {
    render(
      <HouseTable
        houses={noHousesVM.houses}
        angles={noHousesVM.angles}
        houseDataAvailable={noHousesVM.flags.houseDataAvailable}
        hasAngles={noHousesVM.flags.hasAngles}
        houseSystemLabel={noHousesVM.meta.houseSystem.labelVi}
        unavailableContent={
          <div data-testid="test-notice">Notice: Giờ sinh chưa xác định</div>
        }
      />,
    );

    // No house table caption or house table
    expect(screen.queryByText(/Nhà theo hệ.*12 hàng/)).not.toBeInTheDocument();

    // Unavailable notice is rendered
    expect(screen.getByTestId("test-notice")).toBeInTheDocument();
  });

  it("H5: renders angles table with exactly 4 angles in correct order when hasAngles is true", () => {
    render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
      />,
    );

    expect(screen.getByText("Các góc chính")).toBeInTheDocument();

    const anglesCaption = screen.getByText(
      new RegExp(`Các góc chính — Natal Chart, ${fullVM.angles.length} hàng`),
    );
    expect(anglesCaption).toHaveClass("sr-only");

    const tables = screen.getAllByRole("table");
    const anglesTable = tables[1]!;
    const rows = anglesTable.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(fullVM.angles.length);

    fullVM.angles.forEach((angle, idx) => {
      expect(rows[idx]).toHaveTextContent(angle.labelVi);
      expect(rows[idx]).toHaveTextContent(angle.sign.labelVi);
      expect(rows[idx]).toHaveTextContent(angle.degreeLabel!);
      if (angle.shortLabel) {
        expect(rows[idx]).toHaveTextContent(angle.shortLabel);
      }
    });
  });

  it("H6: omits angles section when hasAngles is false", () => {
    render(
      <HouseTable
        houses={fullVM.houses}
        angles={[]}
        houseDataAvailable={true}
        hasAngles={false}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
      />,
    );

    expect(screen.queryByText("Các góc chính")).not.toBeInTheDocument();
    // Only 1 table (houses) is present
    expect(screen.getAllByRole("table")).toHaveLength(1);
  });

  it("H7: renders both unavailableContent and angles table when houseDataAvailable is false and hasAngles is true", () => {
    render(
      <HouseTable
        houses={noHousesVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={false}
        hasAngles={true}
        houseSystemLabel={noHousesVM.meta.houseSystem.labelVi}
        unavailableContent={
          <div data-testid="unavailable-slot">Notice slot</div>
        }
      />,
    );

    // Unavailable slot is rendered
    expect(screen.getByTestId("unavailable-slot")).toBeInTheDocument();

    // Angles section is also rendered
    expect(screen.getByText("Các góc chính")).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(1); // Only angles table
  });

  it("H8: renders cards layout for houses and angles with role='list' and without table", () => {
    render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
        layout="cards"
      />,
    );

    // No table in cards layout
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThanOrEqual(2); // houses list + angles list

    // Verify first house card
    expect(screen.getByText("Nhà thứ 1")).toBeInTheDocument();

    // Verify angles in cards
    expect(screen.getByText("Cung Mọc")).toBeInTheDocument();
  });

  it("H9: displays house system badge in section header", () => {
    render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
      />,
    );

    expect(
      screen.getByText(fullVM.meta.houseSystem.labelVi),
    ).toBeInTheDocument();
  });

  it("passes axe accessibility checks for both full data and missing house data", async () => {
    const { container: fullContainer } = render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
      />,
    );
    expect(await axe(fullContainer)).toHaveNoViolations();

    const { container: cardsContainer } = render(
      <HouseTable
        houses={fullVM.houses}
        angles={fullVM.angles}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        hasAngles={fullVM.flags.hasAngles}
        houseSystemLabel={fullVM.meta.houseSystem.labelVi}
        layout="cards"
      />,
    );
    expect(await axe(cardsContainer)).toHaveNoViolations();

    const { container: noHousesContainer } = render(
      <HouseTable
        houses={noHousesVM.houses}
        angles={noHousesVM.angles}
        houseDataAvailable={false}
        hasAngles={true}
        houseSystemLabel={noHousesVM.meta.houseSystem.labelVi}
        unavailableContent={<div role="status">Dữ liệu nhà chưa khả dụng</div>}
      />,
    );
    expect(await axe(noHousesContainer)).toHaveNoViolations();
  });
});
