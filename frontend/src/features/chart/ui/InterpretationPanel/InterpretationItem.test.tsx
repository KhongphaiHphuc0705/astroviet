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

it("A6-RM01: enforces motion-reduce utility classes on article, chevron, and viewOnChart button", () => {
  const { container } = render(
    <InterpretationItem {...defaults} expanded onViewOnChart={vi.fn()} />,
  );

  // 1. Article has motion-reduce:transition-none
  const article = container.querySelector("article");
  expect(article).not.toBeNull();
  expect(article?.className).toContain("motion-reduce:transition-none");

  // 2. Chevron icon has motion-reduce:transition-none
  const chevron = container.querySelector("svg");
  expect(chevron).not.toBeNull();
  expect(chevron?.getAttribute("class")).toContain(
    "motion-reduce:transition-none",
  );

  // 3. View on chart button has motion-reduce:transition-none and motion-reduce:active:scale-100
  const viewBtn = screen.getByRole("button", {
    name: "Xem trên biểu đồ: Mặt Trời",
  });
  expect(viewBtn.className).toContain("motion-reduce:transition-none");
  expect(viewBtn.className).toContain("motion-reduce:active:scale-100");
});

it("A6-T01: enforces mobile touch target and readability max-width constraints", () => {
  const { container } = render(
    <InterpretationItem {...defaults} expanded onViewOnChart={vi.fn()} />,
  );

  // Disclosure button meets min 44px touch target on mobile and scroll margin
  const disclosureBtn = screen.getByRole("button", {
    name: "Mặt Trời · Ma Kết",
  });
  expect(disclosureBtn.className).toContain("min-h-[44px]");
  expect(disclosureBtn.className).toContain("scroll-mt-20");

  // View on chart button meets min 44px on mobile (min-h-[44px] sm:min-h-8)
  const viewBtn = screen.getByRole("button", {
    name: "Xem trên biểu đồ: Mặt Trời",
  });
  expect(viewBtn.className).toContain("min-h-[44px]");

  // Term dt uses text-secondary for high contrast (H6-07)
  const dt = container.querySelector("dt");
  expect(dt?.className).toContain("text-secondary");

  // Body text dd is constrained by max-w-[65ch] and text-body-md for 70-75 cpl desktop readability
  const dd = container.querySelector("dd");
  expect(dd?.className).toContain("max-w-[65ch]");
  expect(dd?.className).toContain("text-body-md");
  expect(dd?.className).toContain("leading-relaxed");
});
