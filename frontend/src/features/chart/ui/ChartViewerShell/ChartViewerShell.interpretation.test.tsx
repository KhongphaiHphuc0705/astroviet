import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildInterpretationModel } from "../../model/interpretation";

import { ChartViewerShell } from "./ChartViewerShell";

describe("ChartViewerShell interpretation integration", () => {
  it("keeps the panel optional for existing F4 callers", () => {
    render(<ChartViewerShell vm={toChartViewModel(chartFull)} />);
    expect(screen.queryByRole("region", { name: "Diễn giải" })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Vị trí hành tinh" }),
    ).toBeInTheDocument();
  });

  it("renders interpretation after the existing chart tables", () => {
    render(
      <ChartViewerShell
        vm={toChartViewModel(chartFull)}
        interpretation={buildInterpretationModel(
          chartFull,
          toChartViewModel(chartFull),
        )}
      />,
    );
    const tables = document.getElementById("chart-data-tables");
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    expect(tables?.compareDocumentPosition(panel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(
      screen.getByRole("heading", { name: "Biểu đồ lá số" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Chiêm tinh là một góc nhìn để bạn khám phá và suy ngẫm về bản thân, không phải kết luận tuyệt đối về con người hay tương lai. Hãy đón nhận những nội dung phù hợp với trải nghiệm của chính bạn.",
      ),
    ).toBeInTheDocument();
  });

  it("SH-03: selecting a planet in chart does not change interpretation panel state", () => {
    render(
      <ChartViewerShell
        vm={toChartViewModel(chartFull)}
        interpretation={buildInterpretationModel(
          chartFull,
          toChartViewModel(chartFull),
        )}
      />,
    );
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const sunItemToggle = within(panel).getByRole("button", {
      name: /^Mặt Trời/,
    });
    expect(sunItemToggle).toHaveAttribute("aria-expanded", "true");

    const selectSunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
    fireEvent.click(selectSunBtn);

    expect(screen.getByRole("button", { name: "Bỏ chọn" })).toBeInTheDocument();
    expect(sunItemToggle).toHaveAttribute("aria-expanded", "true");
  });

  it("SH-04: toggling interpretation panel items does not mutate or trigger chart selection", () => {
    render(
      <ChartViewerShell
        vm={toChartViewModel(chartFull)}
        interpretation={buildInterpretationModel(
          chartFull,
          toChartViewModel(chartFull),
        )}
      />,
    );
    expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const sunItemToggle = within(panel).getByRole("button", {
      name: /^Mặt Trời/,
    });
    fireEvent.click(sunItemToggle);
    expect(sunItemToggle).toHaveAttribute("aria-expanded", "false");

    expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();
  });
});
