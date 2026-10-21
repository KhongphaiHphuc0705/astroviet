import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";

import { PlanetTable } from "./PlanetTable";

describe("PlanetTable", () => {
  const fullVM = toChartViewModel(chartFull);
  const noHousesVM = toChartViewModel(chartNoHouses);

  it("P1: renders exact row count and order matching ViewModel", () => {
    render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
      />,
    );

    const rows = screen.getAllByRole("row");
    // 1 header row + N planet rows
    expect(rows).toHaveLength(fullVM.planets.length + 1);

    // Verify row order matches VM order
    const rowHeaders = screen.getAllByRole("rowheader");
    expect(rowHeaders).toHaveLength(fullVM.planets.length);
    fullVM.planets.forEach((planet, index) => {
      expect(rowHeaders[index]).toHaveTextContent(planet.nameVi);
    });
  });

  it("P2: renders correct sign, degree, and house values", () => {
    render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
      />,
    );

    const sun = fullVM.planets.find((p) => p.key === "Sun")!;
    expect(sun).toBeDefined();

    // Row containing Sun
    const sunRow = screen.getByRole("row", { name: new RegExp(sun.nameVi) });
    expect(sunRow).toHaveTextContent(sun.sign.labelVi);
    expect(sunRow).toHaveTextContent(sun.degreeLabel!);
    expect(sunRow).toHaveTextContent(String(sun.houseNumber!));
  });

  it("P3: omits House column when houseDataAvailable is false", () => {
    const { rerender } = render(
      <PlanetTable
        planets={noHousesVM.planets}
        houseDataAvailable={noHousesVM.flags.houseDataAvailable}
      />,
    );

    // Table view: no "Nhà" column header
    expect(
      screen.queryByRole("columnheader", { name: /^nhà$/i }),
    ).not.toBeInTheDocument();

    // Cards view: no "Nhà" field in definition lists
    rerender(
      <PlanetTable
        planets={noHousesVM.planets}
        houseDataAvailable={noHousesVM.flags.houseDataAvailable}
        layout="cards"
      />,
    );
    expect(screen.queryByText(/^nhà$/i)).not.toBeInTheDocument();
  });

  it("P4: displays Retrograde status with text and accessible label", () => {
    render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
      />,
    );

    // Mercury is retrograde in chartFull
    const mercury = fullVM.planets.find((p) => p.key === "Mercury")!;
    expect(mercury.isRetrograde).toBe(true);

    const mercuryRow = screen.getByRole("row", {
      name: new RegExp(mercury.nameVi),
    });
    expect(mercuryRow).toHaveTextContent("Nghịch hành");
    expect(mercuryRow).toHaveTextContent("℞");

    // Sun is direct in chartFull
    const sun = fullVM.planets.find((p) => p.key === "Sun")!;
    expect(sun.isRetrograde).toBe(false);

    const sunRow = screen.getByRole("row", { name: new RegExp(sun.nameVi) });
    expect(sunRow).toHaveTextContent("Không nghịch hành");
  });

  it("P5: has accessible caption and proper scope attributes", () => {
    render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
      />,
    );

    // Accessible caption
    const caption = screen.getByText(
      new RegExp(
        `Vị trí hành tinh — Natal Chart, ${fullVM.planets.length} hàng`,
      ),
    );
    expect(caption).toHaveClass("sr-only");

    // Column headers scope="col"
    const colHeaders = screen.getAllByRole("columnheader");
    colHeaders.forEach((th) => {
      expect(th).toHaveAttribute("scope", "col");
    });

    // Row headers scope="row"
    const rowHeaders = screen.getAllByRole("rowheader");
    rowHeaders.forEach((th) => {
      expect(th).toHaveAttribute("scope", "row");
    });
  });

  it("P6: renders selection button when onSelect is provided, with keyboard support and aria-pressed", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    const { rerender } = render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        selectedKey="Sun"
        onSelect={handleSelect}
      />,
    );

    const sunButton = screen.getByRole("button", { name: "Chọn Mặt Trời" });
    expect(sunButton).toHaveAttribute("aria-pressed", "true");

    const moonButton = screen.getByRole("button", { name: "Chọn Mặt Trăng" });
    expect(moonButton).toHaveAttribute("aria-pressed", "false");

    // Click triggers onSelect
    await user.click(moonButton);
    expect(handleSelect).toHaveBeenCalledWith("Moon");

    // Enter key triggers onSelect
    sunButton.focus();
    expect(sunButton).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(handleSelect).toHaveBeenCalledWith("Sun");

    // Space key triggers onSelect
    await user.keyboard(" ");
    expect(handleSelect).toHaveBeenCalledWith("Sun");

    // Change selectedKey
    rerender(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        selectedKey="Moon"
        onSelect={handleSelect}
      />,
    );
    expect(sunButton).toHaveAttribute("aria-pressed", "false");
    expect(moonButton).toHaveAttribute("aria-pressed", "true");
  });

  it("P7: does not render button elements when onSelect is omitted", () => {
    render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("P8: renders cards layout with role='list' and without table", () => {
    render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        layout="cards"
      />,
    );

    // No table element exists in cards layout
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(fullVM.planets.length);

    // All fields are present in card
    const firstCard = items[0]!;
    expect(firstCard).toHaveTextContent(fullVM.planets[0]!.nameVi);
    expect(firstCard).toHaveTextContent(fullVM.planets[0]!.sign.labelVi);
    expect(firstCard).toHaveTextContent(fullVM.planets[0]!.degreeLabel!);
    expect(firstCard).toHaveTextContent(
      String(fullVM.planets[0]!.houseNumber!),
    );
  });

  it("P9: does not duplicate DOM representations between table and cards", () => {
    const { rerender } = render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        layout="table"
      />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    rerender(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        layout="cards"
      />,
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("P10: applies density padding classes correctly", () => {
    const { rerender } = render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        density="comfortable"
      />,
    );

    const firstHeader = screen.getAllByRole("columnheader")[0]!;
    expect(firstHeader).toHaveClass("px-3 py-3");

    rerender(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        density="compact"
      />,
    );
    expect(firstHeader).toHaveClass("px-2 py-2");
  });

  it("P11: renders '—' with accessible text when houseNumber is null", () => {
    const planetsWithNullHouse = fullVM.planets.map((p, i) =>
      i === 0 ? { ...p, houseNumber: null } : p,
    );

    render(
      <PlanetTable planets={planetsWithNullHouse} houseDataAvailable={true} />,
    );

    const firstRow = screen.getAllByRole("row")[1]!;
    expect(firstRow).toHaveTextContent("Không có dữ liệu nhà");
  });

  it("renders EmptyState when planets array is empty", () => {
    render(<PlanetTable planets={[]} houseDataAvailable={true} />);

    expect(
      screen.getByText("Không có dữ liệu hành tinh để hiển thị"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("triggers onPreview for mouse pointer events and focus, ignoring touch pointerType", () => {
    const handlePreview = vi.fn();
    render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={true}
        onSelect={vi.fn()}
        onPreview={handlePreview}
      />,
    );

    const sunButton = screen.getByRole("button", { name: "Chọn Mặt Trời" });

    // Touch pointer events do not trigger preview (no sticky hover)
    fireEvent.pointerEnter(sunButton, { pointerType: "touch" });
    expect(handlePreview).not.toHaveBeenCalled();

    // Mouse pointer events trigger preview
    fireEvent.pointerEnter(sunButton, { pointerType: "mouse" });
    expect(handlePreview).toHaveBeenCalledWith("Sun", "hover", "enter");

    fireEvent.pointerLeave(sunButton, { pointerType: "mouse" });
    expect(handlePreview).toHaveBeenCalledWith("Sun", "hover", "leave");

    // Focus & blur trigger preview with focus source
    fireEvent.focus(sunButton);
    expect(handlePreview).toHaveBeenCalledWith("Sun", "focus", "enter");

    fireEvent.blur(sunButton);
    expect(handlePreview).toHaveBeenCalledWith("Sun", "focus", "leave");
  });

  it("passes axe accessibility checks across table and cards with and without selection", async () => {
    const { container: tableContainer } = render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        selectedKey="Sun"
        onSelect={vi.fn()}
      />,
    );
    expect(await axe(tableContainer)).toHaveNoViolations();

    const { container: cardsContainer } = render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
        layout="cards"
        selectedKey="Moon"
        onSelect={vi.fn()}
      />,
    );
    expect(await axe(cardsContainer)).toHaveNoViolations();

    const { container: noSelectContainer } = render(
      <PlanetTable
        planets={fullVM.planets}
        houseDataAvailable={fullVM.flags.houseDataAvailable}
      />,
    );
    expect(await axe(noSelectContainer)).toHaveNoViolations();
  });
});
