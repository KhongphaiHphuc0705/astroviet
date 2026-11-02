// OV-01 to OV-A: supplied count, navigation links, and approved scope copy.
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import type { InterpretationGroup } from "../../model/interpretation";

import { formatCount } from "./interpretationCopy";
import { InterpretationOverview } from "./InterpretationOverview";

const groups: InterpretationGroup[] = [
  { id: "core", itemIds: ["planet:Sun", "planet:Moon", "angle:Ascendant"] },
  { id: "planets", itemIds: ["planet:Mercury"] },
];

it("OV-01 and OV-02: should display the supplied count using the copy formatter", () => {
  expect(formatCount(21)).toBe("Có 21 diễn giải cho lá số này");
  render(
    <InterpretationOverview
      availableCount={10}
      groups={groups}
      houseDataAvailable
      onGroupLinkClick={vi.fn()}
    />,
  );
  expect(screen.getByText("Có 10 diễn giải cho lá số này")).toBeVisible();
});

it("OV-03: should preserve group hrefs and handle normal activation", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(
    <InterpretationOverview
      availableCount={21}
      groups={groups}
      houseDataAvailable
      onGroupLinkClick={onClick}
    />,
  );
  const link = screen.getByRole("link", { name: "Các hành tinh (1)" });
  expect(link).toHaveAttribute("href", "#interpretation-group-planets");
  await user.click(link);
  expect(onClick).toHaveBeenCalledWith("planets");
});

it("OV-04: should show scope copy and the approved disclaimer once", () => {
  render(
    <InterpretationOverview
      availableCount={21}
      groups={groups}
      houseDataAvailable
      onGroupLinkClick={vi.fn()}
    />,
  );
  expect(
    screen.getByText(
      "Diễn giải góc chiếu và nhận định tổng hợp toàn lá số hiện chưa có nội dung.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Chiêm tinh là một góc nhìn để bạn khám phá và suy ngẫm về bản thân, không phải kết luận tuyệt đối về con người hay tương lai. Hãy đón nhận những nội dung phù hợp với trải nghiệm của chính bạn.",
    ),
  ).toBeInTheDocument();
});

it("OV-05: should omit empty navigation while retaining count", () => {
  render(
    <InterpretationOverview
      availableCount={0}
      groups={[]}
      houseDataAvailable
      onGroupLinkClick={vi.fn()}
    />,
  );
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  expect(screen.getByText("Có 0 diễn giải cho lá số này")).toBeVisible();
});

it("OV-06: should show the house note only when house data is unavailable", () => {
  const { rerender } = render(
    <InterpretationOverview
      availableCount={10}
      groups={groups}
      houseDataAvailable={false}
      onGroupLinkClick={vi.fn()}
    />,
  );
  expect(screen.getByText(/Dữ liệu Nhà/)).toBeVisible();
  rerender(
    <InterpretationOverview
      availableCount={21}
      groups={groups}
      houseDataAvailable
      onGroupLinkClick={vi.fn()}
    />,
  );
  expect(screen.queryByText(/Dữ liệu Nhà/)).not.toBeInTheDocument();
});

it("OV-07: should ignore clicks with modifier keys or non-primary mouse buttons", () => {
  const onClick = vi.fn();
  render(
    <InterpretationOverview
      availableCount={21}
      groups={groups}
      houseDataAvailable
      onGroupLinkClick={onClick}
    />,
  );
  const link = screen.getByRole("link", { name: "Các hành tinh (1)" });

  // Secondary/middle mouse button
  fireEvent.click(link, { button: 1 });
  expect(onClick).not.toHaveBeenCalled();

  // Modifier keys
  fireEvent.click(link, { ctrlKey: true });
  expect(onClick).not.toHaveBeenCalled();

  fireEvent.click(link, { metaKey: true });
  expect(onClick).not.toHaveBeenCalled();

  fireEvent.click(link, { shiftKey: true });
  expect(onClick).not.toHaveBeenCalled();

  fireEvent.click(link, { altKey: true });
  expect(onClick).not.toHaveBeenCalled();
});

it("OV-A: should pass axe", async () => {
  const { container } = render(
    <InterpretationOverview
      availableCount={21}
      groups={groups}
      houseDataAvailable
      onGroupLinkClick={vi.fn()}
    />,
  );
  expect(await axe(container)).toHaveNoViolations();
});
