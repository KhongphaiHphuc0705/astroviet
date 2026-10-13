import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { HouseDataNotice } from "./HouseDataNotice";

describe("HouseDataNotice", () => {
  it("renders base notice with role status and neutral explanation", () => {
    render(<HouseDataNotice />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByText("Dữ liệu Nhà và các góc chưa khả dụng"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Lá số này hiển thị không có Nhà và các góc \(Cung Mọc, MC, DSC, IC\)\./,
      ),
    ).toBeInTheDocument();
  });

  it("appends backend explanation when HOUSE_SYSTEM_NOT_CONVERGING warning is present", () => {
    render(
      <HouseDataNotice
        warnings={[
          {
            code: "HOUSE_SYSTEM_NOT_CONVERGING",
            severity: "warning",
            labelVi: "Không tính được chính xác hệ nhà tại vị trí này.",
          },
        ]}
      />,
    );

    expect(
      screen.getByText(/Không tính được chính xác hệ nhà tại vị trí này\./),
    ).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(<HouseDataNotice />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
