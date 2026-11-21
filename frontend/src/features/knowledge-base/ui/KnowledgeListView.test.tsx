import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { VALID_FIXTURE_MANIFEST } from "@test/fixtures/knowledge-base/manifests";

import type { KnowledgeArticleMetadata } from "../model/types";

import { KnowledgeListView } from "./KnowledgeListView";

describe("KnowledgeListView (KB-U13, KB-U14, KB-U35, KB-AC-13, 15, 16, 17)", () => {
  it("renders responsive grid with ul[role=list], semantic li items, and correct column classes (KB-U13)", () => {
    const { container } = render(
      <MemoryRouter>
        <KnowledgeListView articles={VALID_FIXTURE_MANIFEST} />
      </MemoryRouter>,
    );

    const listElement = container.querySelector('ul[role="list"]');
    expect(listElement).toBeInTheDocument();
    expect(listElement).toHaveClass(
      "grid",
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-3",
      "gap-6",
    );

    const listItems = container.querySelectorAll('ul[role="list"] > li');
    expect(listItems).toHaveLength(VALID_FIXTURE_MANIFEST.length);
  });

  it("renders live status counter matching the number of displayed articles", () => {
    render(
      <MemoryRouter>
        <KnowledgeListView articles={VALID_FIXTURE_MANIFEST} />
      </MemoryRouter>,
    );

    const statusElement = screen.getByRole("status");
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveTextContent(
      `Hiển thị ${VALID_FIXTURE_MANIFEST.length} bài viết`,
    );
  });

  it("filters articles by category and updates live count accordingly (KB-U35, KB-AC-15)", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter>
        <KnowledgeListView articles={VALID_FIXTURE_MANIFEST} />
      </MemoryRouter>,
    );

    // Initial state: "Tất cả" is pressed
    const allButton = screen.getByRole("button", { name: "Tất cả" });
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll('ul[role="list"] > li')).toHaveLength(6);

    // Filter by "Hành tinh" (planets has 2 articles in fixture)
    const planetsButton = screen.getByRole("button", { name: "Hành tinh" });
    await user.click(planetsButton);

    expect(planetsButton).toHaveAttribute("aria-pressed", "true");
    expect(allButton).toHaveAttribute("aria-pressed", "false");

    const statusElement = screen.getByRole("status");
    expect(statusElement).toHaveTextContent("Hiển thị 2 bài viết");

    const planetCards = container.querySelectorAll('ul[role="list"] > li');
    expect(planetCards).toHaveLength(2);
    expect(screen.getByText("Mặt Trời trong chiêm tinh")).toBeInTheDocument();
    expect(screen.getByText("Mặt Trăng trong chiêm tinh")).toBeInTheDocument();
    expect(screen.queryByText("Chiêm tinh học là gì?")).not.toBeInTheDocument();

    // Filter by "Khái niệm cơ bản" (1 article in fixture)
    const fundamentalsButton = screen.getByRole("button", {
      name: "Khái niệm cơ bản",
    });
    await user.click(fundamentalsButton);

    expect(fundamentalsButton).toHaveAttribute("aria-pressed", "true");
    expect(planetsButton).toHaveAttribute("aria-pressed", "false");
    expect(statusElement).toHaveTextContent("Hiển thị 1 bài viết");

    const fundamentalCards = container.querySelectorAll('ul[role="list"] > li');
    expect(fundamentalCards).toHaveLength(1);
    expect(screen.getByText("Chiêm tinh học là gì?")).toBeInTheDocument();

    // Reset back to "Tất cả" via filter button (KB-AC-16)
    await user.click(allButton);
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(statusElement).toHaveTextContent("Hiển thị 6 bài viết");
    expect(container.querySelectorAll('ul[role="list"] > li')).toHaveLength(6);
  });

  it("renders EmptyState when category has 0 articles and restores focus to 'Tất cả' on reset (KB-U14, KB-AC-17, D-F6.3-12)", async () => {
    const user = userEvent.setup();

    // Create manifest with 0 "aspects" articles
    const withoutAspects: KnowledgeArticleMetadata[] =
      VALID_FIXTURE_MANIFEST.filter((a) => a.category !== "aspects");

    render(
      <MemoryRouter>
        <KnowledgeListView articles={withoutAspects} />
      </MemoryRouter>,
    );

    const aspectsButton = screen.getByRole("button", { name: "Góc chiếu" });
    await user.click(aspectsButton);

    // Empty state heading level 2 (D-F6.3-06 Option A)
    const emptyHeading = screen.getByRole("heading", { level: 2 });
    expect(emptyHeading).toHaveTextContent("Chưa có bài viết trong chủ đề này");

    // Counter shows 0
    expect(screen.getByText("Hiển thị 0 bài viết")).toBeInTheDocument();

    // Reset button
    const resetButton = screen.getByRole("button", {
      name: "Xem tất cả bài viết",
    });
    expect(resetButton).toBeInTheDocument();

    // Click reset: filter resets to "all" and moves focus to the "Tất cả" button
    await user.click(resetButton);

    const allButton = screen.getByRole("button", { name: "Tất cả" });
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(document.activeElement).toBe(allButton);
    expect(
      screen.getByText(`Hiển thị ${withoutAspects.length} bài viết`),
    ).toBeInTheDocument();
  });

  it("renders empty state immediately when articles array is empty", () => {
    render(
      <MemoryRouter>
        <KnowledgeListView articles={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Hiển thị 0 bài viết")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Chưa có bài viết trong chủ đề này",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Xem tất cả bài viết" }),
    ).toBeInTheDocument();
  });

  it("has zero accessibility violations in populated state (axe KB-A01)", async () => {
    const { container } = render(
      <MemoryRouter>
        <KnowledgeListView articles={VALID_FIXTURE_MANIFEST} />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has zero accessibility violations in empty state (axe KB-A06, S1)", async () => {
    const { container } = render(
      <MemoryRouter>
        <KnowledgeListView articles={[]} />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
