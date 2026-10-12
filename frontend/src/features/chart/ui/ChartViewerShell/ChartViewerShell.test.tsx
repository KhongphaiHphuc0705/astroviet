import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";

import { ChartViewerShell } from "./ChartViewerShell";

describe("ChartViewerShell", () => {
  it("renders metadata, engine version, and visualization placeholder cleanly for chartFull", () => {
    const vm = toChartViewModel(chartFull);
    render(<ChartViewerShell vm={vm} />);

    expect(screen.getByText("Hệ nhà")).toBeInTheDocument();
    expect(screen.getByText("Placidus")).toBeInTheDocument();
    expect(screen.getByText("Tính lúc")).toBeInTheDocument();
    expect(screen.getByText(chartFull.engineVersion)).toBeInTheDocument();

    const timeElement = screen.getByText((_, element) => {
      return (
        element?.tagName.toLowerCase() === "time" &&
        element.getAttribute("dateTime") === chartFull.calculatedAt
      );
    });
    expect(timeElement).toBeInTheDocument();

    expect(
      screen.getByTestId("chart-visualization-placeholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Biểu đồ tròn và các bảng hành tinh, nhà, góc chiếu sẽ xuất hiện ở đây.",
      ),
    ).toBeInTheDocument();

    // No house data notice when houses are available
    expect(
      screen.queryByText("Dữ liệu Nhà và các góc chưa khả dụng"),
    ).not.toBeInTheDocument();
    // No partial data warning
    expect(screen.queryByText("Dữ liệu chưa đầy đủ")).not.toBeInTheDocument();
  });

  it("renders HouseDataNotice when houseDataAvailable is false", () => {
    const vm = toChartViewModel(chartNoHouses);
    render(<ChartViewerShell vm={vm} />);

    expect(
      screen.getByText("Dữ liệu Nhà và các góc chưa khả dụng"),
    ).toBeInTheDocument();
  });

  it("renders partialData warning alert when flags.partialData is true", () => {
    const vm = toChartViewModel(chartFull);
    const vmWithPartial = {
      ...vm,
      flags: {
        ...vm.flags,
        partialData: true,
      },
    };

    render(<ChartViewerShell vm={vmWithPartial} />);

    expect(screen.getByText("Dữ liệu chưa đầy đủ")).toBeInTheDocument();
    expect(
      screen.getByText("Một số dữ liệu của lá số chưa thể hiển thị đầy đủ."),
    ).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const vm = toChartViewModel(chartFull);
    const { container } = render(<ChartViewerShell vm={vm} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
