import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import type { KnowledgeArticleMetadata } from "../model/types";

import { ArticleCard } from "./ArticleCard";

describe("ArticleCard (KB-U31a, D-F6.3-02, D-F6.3-04)", () => {
  const sampleArticle: KnowledgeArticleMetadata = {
    slug: "what-is-astrology",
    title: "Chiêm tinh học là gì?",
    category: "fundamentals",
    summary:
      "Tổng quan nền tảng về nguồn gốc, nguyên lý vận hành và ứng dụng của chiêm tinh phương Tây.",
    order: 1,
    updatedAt: "2026-11-20",
  };

  it("renders article content, category badge, and formatted date (KB-U31a)", () => {
    const { container } = render(
      <MemoryRouter>
        <ArticleCard article={sampleArticle} />
      </MemoryRouter>,
    );

    // Category badge
    expect(screen.getByText("Khái niệm cơ bản")).toBeInTheDocument();

    // Title & heading
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Chiêm tinh học là gì?");

    // Summary
    expect(
      screen.getByText(
        "Tổng quan nền tảng về nguồn gốc, nguyên lý vận hành và ứng dụng của chiêm tinh phương Tây.",
      ),
    ).toBeInTheDocument();

    // Formatted date and semantic time element (only wrapping the date, not "Cập nhật")
    const timeElement = container.querySelector("time");
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveAttribute("dateTime", "2026-11-20");
    expect(timeElement).toHaveTextContent("20/11/2026");
    expect(timeElement?.parentElement).toHaveTextContent("Cập nhật 20/11/2026");
  });

  it("renders semantic article element and exactly one accessible link", () => {
    const { container } = render(
      <MemoryRouter>
        <ArticleCard article={sampleArticle} />
      </MemoryRouter>,
    );

    // Root article element
    const articleElement = container.querySelector("article");
    expect(articleElement).toBeInTheDocument();

    // Single link with accessible name = article title
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);

    const link = links[0];
    expect(link).toHaveTextContent("Chiêm tinh học là gì?");
    expect(link).toHaveAttribute("href", "/knowledge/what-is-astrology");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
  });

  it("navigates to the article route without page reload when clicked", async () => {
    const user = userEvent.setup();
    let currentLocation = "";

    function LocationObserver() {
      const location = useLocation();
      currentLocation = location.pathname;
      return <div data-testid="location">{location.pathname}</div>;
    }

    render(
      <MemoryRouter initialEntries={["/knowledge"]}>
        <ArticleCard article={sampleArticle} />
        <LocationObserver />
      </MemoryRouter>,
    );

    expect(currentLocation).toBe("/knowledge");

    const link = screen.getByRole("link", { name: "Chiêm tinh học là gì?" });
    await user.click(link);

    expect(currentLocation).toBe("/knowledge/what-is-astrology");
  });

  it("renders long titles and summaries without truncation classes (KB-U31a)", () => {
    const longArticle: KnowledgeArticleMetadata = {
      slug: "very-long-article-title-for-testing-purposes",
      title:
        "Tiêu đề rất dài nhằm kiểm tra khả năng xuống dòng tự nhiên của thẻ bài viết mà không bị cắt bớt bằng thuộc tính truncate hay ellipsis",
      category: "planets",
      summary:
        "Tóm tắt rất dài chứa nhiều câu liên tiếp để bảo đảm văn bản hiển thị đầy đủ, ngắt dòng đẹp mắt và không gây vỡ giao diện trên các kích thước màn hình khác nhau.",
      order: 2,
      updatedAt: "2026-05-01",
    };

    const { container } = render(
      <MemoryRouter>
        <ArticleCard article={longArticle} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Hành tinh")).toBeInTheDocument();

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent(longArticle.title);
    expect(heading).not.toHaveClass("truncate");

    const summary = screen.getByText(longArticle.summary);
    expect(summary).toBeInTheDocument();
    expect(summary).not.toHaveClass("truncate");

    const timeElement = container.querySelector("time");
    expect(timeElement).toHaveTextContent("01/05/2026");
    expect(timeElement?.parentElement).toHaveTextContent("Cập nhật 01/05/2026");
  });

  it("merges custom className prop correctly", () => {
    const { container } = render(
      <MemoryRouter>
        <ArticleCard article={sampleArticle} className="custom-test-card" />
      </MemoryRouter>,
    );

    const articleElement = container.querySelector("article");
    expect(articleElement).toHaveClass("custom-test-card");
  });

  it("has zero accessibility violations (axe)", async () => {
    const { container } = render(
      <MemoryRouter>
        <ArticleCard article={sampleArticle} />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
