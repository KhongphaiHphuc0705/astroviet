import { render, screen } from "@testing-library/react";
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
});
