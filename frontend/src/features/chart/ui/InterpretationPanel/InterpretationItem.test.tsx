// IT-01 to IT-A: controlled disclosure, safe text, and accessible semantics.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import type { InterpretationPart } from "../../model/interpretation";

import { InterpretationItem } from "./InterpretationItem";

const available: InterpretationPart = {
  state: "available",
  subjectKey: "Sun_in_Capricorn",
  bodyText: "Một nội dung <b>an toàn</b> & nguyên văn.",
};
const defaults = {
  id: "planet:Sun",
  title: "Mặt Trời",
  glyph: "☉",
  signLabel: "Ma Kết",
  houseLabel: "Nhà 9",
  bySign: available,
  byHouse: {
    state: "available",
    subjectKey: "Sun_in_House_9",
    bodyText: "Nội dung theo nhà.",
  } as InterpretationPart,
  expanded: false,
  onToggle: vi.fn(),
};

it("IT-01: should start collapsed when expanded is false", () => {
  render(<InterpretationItem {...defaults} />);
  expect(
    screen.getByRole("button", { name: "Mặt Trời · Ma Kết" }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.getByText("Một nội dung <b>an toàn</b> & nguyên văn."),
  ).not.toBeVisible();
});

it("IT-02 and IT-10: should render available body as text when expanded", () => {
  const { container } = render(<InterpretationItem {...defaults} expanded />);
  expect(
    screen.getByText("Một nội dung <b>an toàn</b> & nguyên văn."),
  ).toBeVisible();
  expect(container.querySelector("b,script")).toBeNull();
});

it("IT-03 and IT-04: should notify the parent on pointer and keyboard activation", async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  render(<InterpretationItem {...defaults} onToggle={onToggle} />);
  const button = screen.getByRole("button", { name: "Mặt Trời · Ma Kết" });
  await user.click(button);
  await user.keyboard("{Enter}");
  await user.keyboard(" ");
  expect(onToggle).toHaveBeenNthCalledWith(1, "planet:Sun");
  expect(onToggle).toHaveBeenCalledTimes(3);
});

it("IT-05 and IT-09: should expose a named controlled region without null-label punctuation", () => {
  render(
    <InterpretationItem
      {...defaults}
      glyph={null}
      signLabel={null}
      houseLabel={null}
    />,
  );
  const button = screen.getByRole("button", { name: "Mặt Trời" });
  expect(button).toHaveAttribute("aria-controls", expect.stringMatching(/.+/));
  expect(button).not.toHaveAccessibleName(expect.stringContaining("·"));
});

it("IT-06: should follow the expanded prop when it changes", () => {
  const { rerender } = render(<InterpretationItem {...defaults} />);
  rerender(<InterpretationItem {...defaults} expanded />);
  expect(
    screen.getByRole("button", { name: "Mặt Trời · Ma Kết" }),
  ).toHaveAttribute("aria-expanded", "true");
});

it("IT-07 and IT-08: should show neutral fallback copy for unresolved parts", () => {
  render(
    <InterpretationItem
      {...defaults}
      expanded
      bySign={{ state: "missing", subjectKey: "x" }}
      byHouse={{ state: "unavailable", reason: "HOUSE_DATA_UNAVAILABLE" }}
    />,
  );
  expect(screen.getByText("Chưa có nội dung cho mục này")).toBeVisible();
  expect(screen.queryByText(/Theo nhà/)).not.toBeInTheDocument();
});

it("IT-08: should explain an absent angle without exposing unavailable house content", () => {
  render(
    <InterpretationItem
      {...defaults}
      expanded
      bySign={{ state: "unavailable", reason: "ANGLE_ABSENT" }}
      byHouse={null}
    />,
  );
  expect(
    screen.getByText("Cung Mọc chưa khả dụng cho lá số này."),
  ).toBeVisible();
});

it("IT-A: should pass axe when disclosure is open and closed", async () => {
  const { container, rerender } = render(<InterpretationItem {...defaults} />);
  expect(await axe(container)).toHaveNoViolations();
  rerender(<InterpretationItem {...defaults} expanded />);
  expect(await axe(container)).toHaveNoViolations();
});
