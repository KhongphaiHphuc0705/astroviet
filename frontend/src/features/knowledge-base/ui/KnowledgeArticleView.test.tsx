import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import * as reportErrorModule from "@shared/lib/report-error";
import {
  IMAGE_FIXTURE_ARTICLE,
  RICH_FIXTURE_ARTICLE,
  XSS_FIXTURE_ARTICLE,
} from "@test/fixtures/knowledge-base/articles";

import type { KnowledgeArticle } from "../model/types";

import { KnowledgeArticleView } from "./KnowledgeArticleView";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("KnowledgeArticleView (KB-U15, KB-U16, KB-U41, KB-U42, KB-U43, KB-U50)", () => {
  const knownSlugs = new Set(["what-is-astrology", "sun-planet"]);
  const isKnownSlug = (slug: string) => knownSlugs.has(slug);

  it("should render exactly one h1, category badge, semantic time, and back-link to /knowledge (KB-U15)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={RICH_FIXTURE_ARTICLE}
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
      screen.queryByText(RICH_FIXTURE_ARTICLE.summary),
    ).not.toBeInTheDocument();
  });

  it("should preserve heading hierarchy h1 -> h2 -> h3 -> h4 without normalized headings on valid markdown (KB-U16)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={RICH_FIXTURE_ARTICLE}
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
      ...RICH_FIXTURE_ARTICLE,
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

  it("should apply 65ch reading column with explicit 16px font on article and render rich elements without text-body-md/lg (KB-U41)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={RICH_FIXTURE_ARTICLE}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );

    const articleEl = container.querySelector("article");
    expect(articleEl).toBeInTheDocument();
    expect(articleEl).toHaveClass(
      "max-w-[65ch]",
      "text-[16px]",
      "leading-relaxed",
      "[overflow-wrap:anywhere]",
    );

    // Rich elements rendered inside the reading column
    expect(articleEl?.querySelector("ul")).toBeInTheDocument();
    expect(articleEl?.querySelector("ol")).toBeInTheDocument();
    expect(articleEl?.querySelector("blockquote")).toBeInTheDocument();
    expect(articleEl?.querySelector("hr")).toBeInTheDocument();
    const preEl = articleEl?.querySelector("pre");
    expect(preEl).toBeInTheDocument();
    expect(preEl).toHaveClass("overflow-x-auto");
    expect(articleEl?.querySelector("code")).toBeInTheDocument();

    // Static source gate: 0 occurrences of broken text-body-md / text-body-lg tokens
    const detailPagePath = resolve(
      __dirname,
      "../../../pages/knowledge/detail/page.tsx",
    );
    const filesToCheck = [
      {
        name: "KnowledgeArticleView.tsx",
        path: join(__dirname, "KnowledgeArticleView.tsx"),
      },
      {
        name: "MarkdownRenderer.tsx",
        path: join(__dirname, "MarkdownRenderer.tsx"),
      },
      {
        name: "ArticleNotFound.tsx",
        path: join(__dirname, "ArticleNotFound.tsx"),
      },
      {
        name: "pages/knowledge/detail/page.tsx",
        path: detailPagePath,
      },
    ];

    for (const file of filesToCheck) {
      const source = readFileSync(file.path, "utf-8");
      expect(
        source,
        `${file.name} must not use undefined text-body-md/text-body-lg classes`,
      ).not.toMatch(/text-body-(?:md|lg)/);
    }
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
          article={RICH_FIXTURE_ARTICLE}
          isKnownSlug={isKnownSlug}
        />
        <LocationObserver />
      </MemoryRouter>,
    );

    expect(currentPathname).toBe("/knowledge/what-is-astrology");

    // External link has target="_blank" and rel="noopener noreferrer"
    const externalLink = screen.getByRole("link", {
      name: "Tài liệu tham khảo",
    });
    expect(externalLink).toHaveAttribute(
      "href",
      "https://example.com/astrology-reference",
    );
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

  it("should render valid local images with alt, lazy loading, async decoding, and max-w-full while rejecting remote or empty-alt images (KB-U43, KB-AC-25)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/zodiac-wheel-guide"]}>
        <KnowledgeArticleView
          article={IMAGE_FIXTURE_ARTICLE}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);

    const img = images[0];
    expect(img).toHaveAttribute("src", "/knowledge/images/zodiac-wheel.webp");
    expect(img).toHaveAttribute("alt", "Biểu đồ vòng tròn 12 cung hoàng đạo");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveClass("max-w-full", "h-auto");

    const fallbacks = container.querySelectorAll(
      '[data-kb-fallback^="image:"]',
    );
    expect(fallbacks).toHaveLength(2);
  });

  it("should strip raw HTML and XSS payloads from article markdown body (KB-U50, AC-F6.4-A05)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/security-check"]}>
        <KnowledgeArticleView
          article={XSS_FIXTURE_ARTICLE}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Đoạn văn hợp lệ.")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[onclick]")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
  });

  it("should hide updated date line and reportError once when updatedAt is invalid (AC-F6.4-A01)", () => {
    const reportSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    const invalidDateArticle: KnowledgeArticle = {
      ...RICH_FIXTURE_ARTICLE,
      updatedAt: "2026-02-30",
    };

    const { container, rerender } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={invalidDateArticle}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector("time")).toBeNull();
    expect(screen.queryByText(/Cập nhật/)).not.toBeInTheDocument();
    expect(reportSpy).toHaveBeenCalledTimes(1);
    expect(reportSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "knowledge-article:invalid-updated-at",
    );

    // Re-rendering with same invalid date does not duplicate reportError
    rerender(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleView
          article={invalidDateArticle}
          isKnownSlug={isKnownSlug}
        />
      </MemoryRouter>,
    );
    expect(reportSpy).toHaveBeenCalledTimes(1);

    reportSpy.mockRestore();
  });
});
