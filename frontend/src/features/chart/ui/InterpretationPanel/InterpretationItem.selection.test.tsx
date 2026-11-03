import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { InterpretationItem } from "./InterpretationItem";

describe("InterpretationItem selection & navigation", () => {
  const defaultProps = {
    id: "planet:Mars",
    title: "Sao Hỏa",
    glyph: "♂",
    signLabel: "Bạch Dương",
    houseLabel: "Nhà 1",
    bySign: {
      state: "available" as const,
      subjectKey: "Mars_in_Aries",
      bodyText: "Sao Hỏa ở Bạch Dương.",
    },
    byHouse: {
      state: "available" as const,
      subjectKey: "Mars_in_House_1",
      bodyText: "Sao Hỏa ở Nhà 1.",
    },
    expanded: true,
    onToggle: vi.fn(),
  };

  it("IS-01: sets aria-current='true', renders 'Đang chọn' badge, and preserves button accessible name when selected", () => {
    render(<InterpretationItem {...defaultProps} selected={true} />);

    const button = screen.getByRole("button", {
      name: "Sao Hỏa · Bạch Dương",
    });
    expect(button).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("Đang chọn")).toBeInTheDocument();
  });

  it("IS-02: omits aria-current and 'Đang chọn' badge when not selected", () => {
    render(<InterpretationItem {...defaultProps} selected={false} />);

    const button = screen.getByRole("button", {
      name: "Sao Hỏa · Bạch Dương",
    });
    expect(button).not.toHaveAttribute("aria-current");
    expect(screen.queryByText("Đang chọn")).toBeNull();
  });

  it("IS-03: renders 'Xem trên biểu đồ' button with accessible name when open and calls onViewOnChart on click/keyboard", async () => {
    const user = userEvent.setup();
    const onViewOnChart = vi.fn();
    render(
      <InterpretationItem
        {...defaultProps}
        expanded={true}
        onViewOnChart={onViewOnChart}
      />,
    );

    const viewButton = screen.getByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveTextContent("Xem trên biểu đồ");

    // Click
    await user.click(viewButton);
    expect(onViewOnChart).toHaveBeenCalledTimes(1);
    expect(onViewOnChart).toHaveBeenCalledWith("planet:Mars");

    // Keyboard Enter
    viewButton.focus();
    await user.keyboard("{Enter}");
    expect(onViewOnChart).toHaveBeenCalledTimes(2);

    // Keyboard Space
    await user.keyboard(" ");
    expect(onViewOnChart).toHaveBeenCalledTimes(3);
  });

  it("IS-04: keeps 'Xem trên biểu đồ' inaccessible when item is collapsed", () => {
    render(
      <InterpretationItem
        {...defaultProps}
        expanded={false}
        onViewOnChart={vi.fn()}
      />,
    );

    const viewButton = screen.queryByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    expect(viewButton).toBeNull();
  });

  it("IS-05: passes the disclosure button node to buttonRef and passes null on unmount", () => {
    const buttonRef = vi.fn();
    const { unmount } = render(
      <InterpretationItem {...defaultProps} buttonRef={buttonRef} />,
    );

    expect(buttonRef).toHaveBeenCalledWith(
      screen.getByRole("button", { name: "Sao Hỏa · Bạch Dương" }),
    );
    unmount();
    expect(buttonRef).toHaveBeenCalledWith(null);
  });

  it("IS-A: passes axe accessibility checks when selected both expanded and collapsed", async () => {
    const { container, rerender } = render(
      <InterpretationItem
        {...defaultProps}
        selected={true}
        expanded={true}
        onViewOnChart={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <InterpretationItem
        {...defaultProps}
        selected={true}
        expanded={false}
        onViewOnChart={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
