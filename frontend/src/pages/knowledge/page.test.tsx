import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { renderWithProviders } from "@test/render";

import KnowledgePage from "./page";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("KnowledgePage (KB-U36, KB-A01, D-F6.3-01, D-F6.3-05)", () => {
  it("renders page title h1, description, category filter, status counter, and article cards (KB-U36)", () => {
    const { container } = renderWithProviders(<KnowledgePage />);

    // Single H1 with exact approved copy
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Kiến thức chiêm tinh");

    // Intro description
    expect(
      screen.getByText(
        "Tìm hiểu các khái niệm nền tảng của chiêm tinh phương Tây: hành tinh, cung hoàng đạo, nhà và góc chiếu.",
      ),
    ).toBeInTheDocument();

    // Category filter group
    expect(
      screen.getByRole("group", { name: "Lọc theo chủ đề" }),
    ).toBeInTheDocument();

    // Live status counter
    expect(screen.getByRole("status")).toHaveTextContent(
      /Hiển thị \d+ bài viết/,
    );

    // At least one article rendered from production manifest
    const articleElements = container.querySelectorAll("article");
    expect(articleElements.length).toBeGreaterThanOrEqual(1);
  });

  it("enforces listing boundaries across page and UI components: no markdown libs, pagination, search inputs, or URL search params (KB-U36, KB-AC-18)", () => {
    const kbUiRoot = resolve(__dirname, "../../features/knowledge-base/ui");
    const filesToScan = [
      { name: "pages/knowledge/page.tsx", path: join(__dirname, "page.tsx") },
      {
        name: "features/knowledge-base/ui/ArticleCard.tsx",
        path: join(kbUiRoot, "ArticleCard.tsx"),
      },
      {
        name: "features/knowledge-base/ui/CategoryFilter.tsx",
        path: join(kbUiRoot, "CategoryFilter.tsx"),
      },
      {
        name: "features/knowledge-base/ui/KnowledgeListView.tsx",
        path: join(kbUiRoot, "KnowledgeListView.tsx"),
      },
    ];

    const forbiddenPatterns: Array<{ label: string; regex: RegExp }> = [
      { label: "MarkdownRenderer", regex: /MarkdownRenderer/ },
      { label: "react-markdown", regex: /react-markdown/ },
      { label: "dangerouslySetInnerHTML", regex: /dangerouslySetInnerHTML/ },
      { label: "import.meta.glob", regex: /import\.meta\.glob/ },
      { label: "Pagination", regex: /Pagination/i },
      { label: 'type="search"', regex: /type=["']search["']/ },
      { label: "useSearchParams", regex: /useSearchParams/ },
    ];

    for (const file of filesToScan) {
      const source = readFileSync(file.path, "utf-8");
      for (const { label, regex } of forbiddenPatterns) {
        expect(
          source,
          `${file.name} must not contain forbidden pattern "${label}"`,
        ).not.toMatch(regex);
      }
    }
  });

  it("has zero accessibility violations (KB-A01, axe)", async () => {
    const { container } = renderWithProviders(<KnowledgePage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("sets listing page metadata via usePageMeta and cleans up on unmount (AC-F6.4-A02, AC-F6.4-A06)", () => {
    const originalTitle = document.title;
    document.title = "AstroViet";

    const { unmount } = renderWithProviders(<KnowledgePage />);

    expect(document.title).toBe("Kiến thức chiêm tinh — AstroViet");
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe(
      "Các bài viết giải thích khái niệm chiêm tinh phương Tây: hành tinh, cung, nhà và góc chiếu.",
    );
    expect(
      document.head
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
    ).toBe("website");
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();

    const canonicalHref = document.head
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    if (canonicalHref !== null && canonicalHref !== undefined) {
      expect(canonicalHref).toMatch(/^https?:\/\/[^/]+\/knowledge$/);
    }

    unmount();

    expect(document.title).toBe("AstroViet");
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    document.title = originalTitle;
  });
});
