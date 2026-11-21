import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import {
  CATEGORY_FILTER_ALL,
  type KnowledgeCategoryFilterValue,
} from "../model/categoryFilter";
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
} from "../model/types";

import { CategoryFilter } from "./CategoryFilter";

describe("CategoryFilter (KB-U31, KB-AC-14, D-F6.3-03, D-F6.3-12)", () => {
  it("renders a semantic group with accessible label and exactly 6 buttons in canonical order", () => {
    render(
      <CategoryFilter selected={CATEGORY_FILTER_ALL} onSelect={vi.fn()} />,
    );

    // Labeled group container
    const group = screen.getByRole("group", { name: "Lọc theo chủ đề" });
    expect(group).toBeInTheDocument();

    // 6 buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(6);

    // Canonical button labels in order: "Tất cả" + KNOWLEDGE_CATEGORIES
    const expectedLabels = [
      "Tất cả",
      ...KNOWLEDGE_CATEGORIES.map((cat) => KNOWLEDGE_CATEGORY_LABELS[cat]),
    ];
    const buttonTexts = buttons.map((btn) => btn.textContent?.trim());
    expect(buttonTexts).toEqual(expectedLabels);
  });

  it("sets aria-pressed='true' on 'Tất cả' when selected is 'all'", () => {
    render(
      <CategoryFilter selected={CATEGORY_FILTER_ALL} onSelect={vi.fn()} />,
    );

    const allButton = screen.getByRole("button", { name: "Tất cả" });
    expect(allButton).toHaveAttribute("aria-pressed", "true");

    for (const category of KNOWLEDGE_CATEGORIES) {
      const label = KNOWLEDGE_CATEGORY_LABELS[category];
      const categoryButton = screen.getByRole("button", { name: label });
      expect(categoryButton).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("sets aria-pressed='true' only on the active category button", () => {
    render(<CategoryFilter selected="planets" onSelect={vi.fn()} />);

    const allButton = screen.getByRole("button", { name: "Tất cả" });
    expect(allButton).toHaveAttribute("aria-pressed", "false");

    const planetsButton = screen.getByRole("button", { name: "Hành tinh" });
    expect(planetsButton).toHaveAttribute("aria-pressed", "true");

    const signsButton = screen.getByRole("button", { name: "Cung" });
    expect(signsButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelect with the corresponding category value when clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <CategoryFilter selected={CATEGORY_FILTER_ALL} onSelect={handleSelect} />,
    );

    // Click "Cung" -> signs
    await user.click(screen.getByRole("button", { name: "Cung" }));
    expect(handleSelect).toHaveBeenCalledWith("signs");

    // Click "Nhà" -> houses
    await user.click(screen.getByRole("button", { name: "Nhà" }));
    expect(handleSelect).toHaveBeenCalledWith("houses");
  });

  it("calls onSelect with 'all' when 'Tất cả' is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<CategoryFilter selected="houses" onSelect={handleSelect} />);

    await user.click(screen.getByRole("button", { name: "Tất cả" }));
    expect(handleSelect).toHaveBeenCalledWith("all");
  });

  it("supports keyboard navigation with Tab, Space, and Enter keys", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <CategoryFilter selected={CATEGORY_FILTER_ALL} onSelect={handleSelect} />,
    );

    const allButton = screen.getByRole("button", { name: "Tất cả" });
    const fundamentalsButton = screen.getByRole("button", {
      name: "Khái niệm cơ bản",
    });

    // Tab into first button
    await user.tab();
    expect(allButton).toHaveFocus();

    // Tab to next button
    await user.tab();
    expect(fundamentalsButton).toHaveFocus();

    // Activate with Space
    await user.keyboard(" ");
    expect(handleSelect).toHaveBeenCalledWith("fundamentals");

    // Tab to next button and activate with Enter
    await user.tab();
    const planetsButton = screen.getByRole("button", { name: "Hành tinh" });
    expect(planetsButton).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(handleSelect).toHaveBeenCalledWith("planets");
  });

  it("binds allButtonRef to the 'Tất cả' button for focus restoration (D-F6.3-12)", () => {
    const allButtonRef = createRef<HTMLElement>();

    render(
      <CategoryFilter
        selected="aspects"
        onSelect={vi.fn()}
        allButtonRef={allButtonRef}
      />,
    );

    expect(allButtonRef.current).not.toBeNull();
    expect(allButtonRef.current?.textContent?.trim()).toBe("Tất cả");

    allButtonRef.current?.focus();
    expect(screen.getByRole("button", { name: "Tất cả" })).toHaveFocus();
  });

  it("merges custom className prop correctly", () => {
    const { container } = render(
      <CategoryFilter
        selected={CATEGORY_FILTER_ALL}
        onSelect={vi.fn()}
        className="custom-category-filter"
      />,
    );

    const group = container.querySelector('[role="group"]');
    expect(group).toHaveClass("custom-category-filter");
  });

  it("has zero accessibility violations across all selected states (axe)", async () => {
    const testCases: KnowledgeCategoryFilterValue[] = [
      CATEGORY_FILTER_ALL,
      ...KNOWLEDGE_CATEGORIES,
    ];

    for (const selectedValue of testCases) {
      const { container, unmount } = render(
        <CategoryFilter selected={selectedValue} onSelect={vi.fn()} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
      unmount();
    }
  });
});
