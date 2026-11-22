import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

import type { KnowledgeArticle } from "../model/types";

import { KnowledgeArticleView } from "./KnowledgeArticleView";

const validArticle: KnowledgeArticle = {
  slug: "what-is-astrology",
  title: "Chiêm tinh học là gì?",
  category: "fundamentals",
  summary: "Tổng quan nền tảng về chiêm tinh học phương Tây.",
  order: 1,
  updatedAt: "2026-11-19",
  markdown: [
    "## Khái niệm cốt lõi",
    "",
    "Chiêm tinh học nghiên cứu mối tương quan biểu tượng giữa các hành tinh và cuộc sống.",
    "",
    "### Bản đồ sao cá nhân",
    "",
    "Xem thêm [Hành tinh Mặt Trời](/knowledge/sun-planet) hoặc [Slug không tồn tại](/knowledge/missing-slug).",
    "",
    "#### Tham khảo ngoài",
    "",
    "Đọc thêm tại [Astro Reference](https://example.com/astro).",
  ].join("\n"),
};

describe("KnowledgeArticleView (KB-U15, KB-U16, KB-U42)", () => {
  const knownSlugs = new Set(["what-is-astrology", "sun-planet"]);
  const isKnownSlug = (slug: string) => knownSlugs.has(slug);

  it("should render exactly one h1, category badge, semantic time, and back-link to /knowledge (KB-U15)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={validArticle}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Chiêm tinh học là gì?");

    expect(screen.getByText("Khái niệm cơ bản")).toBeInTheDocument();

    const timeEl = container.querySelector("time");
    expect(timeEl).toBeInTheDocument();
    expect(timeEl).toHaveAttribute("dateTime", "2026-11-19");
    expect(timeEl).toHaveTextContent("19/11/2026");
    expect(timeEl?.parentElement).toHaveTextContent("Cập nhật 19/11/2026");

    // Back-link above h1 with accessible name "Tất cả bài viết" (arrow aria-hidden)
    const backLink = screen.getByRole("link", { name: "Tất cả bài viết" });
    expect(backLink).toHaveAttribute("href", "/knowledge");
    expect(backLink).toHaveTextContent("←Tất cả bài viết");

    // Summary is NOT displayed in detail body
    expect(
      screen.queryByText("Tổng quan nền tảng về chiêm tinh học phương Tây."),
    ).not.toBeInTheDocument();
  });

  it("should preserve heading hierarchy h1 -> h2 -> h3 -> h4 without normalized headings on valid markdown (KB-U16)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={validArticle}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );

    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    );
    expect(headings.map((h) => h.tagName)).toEqual(["H1", "H2", "H3", "H4"]);
    expect(
      container.querySelector("[data-heading-normalized-from]"),
    ).toBeNull();
  });

  it("should normalize Markdown h1 to h2 so the page still has exactly one h1 (KB-U15, KB-U16)", () => {
    const articleWithMarkdownH1: KnowledgeArticle = {
      ...validArticle,
      markdown: "# Tiêu đề trong Markdown\n\nĐoạn văn mẫu.",
    };

    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={articleWithMarkdownH1}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Chiêm tinh học là gì?");

    const normalizedHeading = container.querySelector(
      '[data-heading-normalized-from="1"]',
    );
    expect(normalizedHeading).toBeInTheDocument();
    expect(normalizedHeading?.tagName).toBe("H2");
    expect(normalizedHeading).toHaveTextContent("Tiêu đề trong Markdown");
  });

  it("should navigate via React Router for internal links, render external links safely, and degrade unknown slugs to plain text (KB-U42)", async () => {
    const user = userEvent.setup();
    let currentPathname = "";

    function LocationObserver() {
      const location = useLocation();
      currentPathname = location.pathname;
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={validArticle}
          isKnownSlug={isKnownSlug}
        />
        <LocationObserver />
      </MemoryRouter>,
    );

    expect(currentPathname).toBe("/knowledge/what-is-astrology");

    // External link has target="_blank" and rel="noopener noreferrer"
    const externalLink = screen.getByRole("link", { name: "Astro Reference" });
    expect(externalLink).toHaveAttribute("href", "https://example.com/astro");
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");

    // Unknown internal slug renders as plain text, not a link
    expect(screen.getByText("Slug không tồn tại")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Slug không tồn tại" }),
    ).not.toBeInTheDocument();

    // Known internal link navigates via React Router without page reload
    const internalLink = screen.getByRole("link", {
      name: "Hành tinh Mặt Trời",
    });
    expect(internalLink).toHaveAttribute("href", "/knowledge/sun-planet");
    await user.click(internalLink);
    expect(currentPathname).toBe("/knowledge/sun-planet");

    // Back-link navigates to /knowledge
    const backLink = screen.getByRole("link", { name: "Tất cả bài viết" });
    await user.click(backLink);
    expect(currentPathname).toBe("/knowledge");
  });
});
