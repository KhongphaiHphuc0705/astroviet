import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import {
  knowledgeContentService,
  type KnowledgeArticleResult,
} from "@features/knowledge-base";
import { createQueryClient } from "@shared/api/queryClient";
import * as reportErrorModule from "@shared/lib/report-error";
import {
  RICH_FIXTURE_ARTICLE,
  SECOND_FIXTURE_ARTICLE,
} from "@test/fixtures/knowledge-base/articles";

import KnowledgeArticlePage from "./page";

function renderDetailRoute(initialPath: string) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/knowledge" element={<h1>Listing Stub</h1>} />
          <Route path="/knowledge/:slug" element={<KnowledgeArticlePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("KnowledgeArticlePage (KB-U49, KB-U52, KB-A08, KB-A10, AC-F6.4-A04)", () => {
  beforeEach(() => {
    document.title = "AstroViet";
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.title = "AstroViet";
    document.head
      .querySelectorAll(
        'meta[name="description"], meta[name="robots"], link[rel="canonical"], meta[property^="og:"]',
      )
      .forEach((el) => el.remove());
  });

  it("should render header h1 immediately while loading body and then render article with metadata (KB-U52)", async () => {
    let resolveArticle!: (result: KnowledgeArticleResult) => void;
    const deferred = new Promise<KnowledgeArticleResult>((resolve) => {
      resolveArticle = resolve;
    });

    vi.spyOn(knowledgeContentService, "getArticleMetadata").mockReturnValue(
      RICH_FIXTURE_ARTICLE,
    );
    vi.spyOn(knowledgeContentService, "getArticle").mockReturnValue(deferred);

    renderDetailRoute("/knowledge/what-is-astrology");

    // Immediate synchronous header with single h1 + loading indicator (no Not Found flash)
    expect(
      screen.getByRole("heading", { level: 1, name: "Chiêm tinh học là gì?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Đang tải nội dung bài viết" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Không tìm thấy bài viết" }),
    ).not.toBeInTheDocument();

    // Metadata set from synchronous metadata
    expect(document.title).toBe("Chiêm tinh học là gì? — AstroViet");
    expect(
      document.head
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
    ).toBe("article");

    // Resolve body
    resolveArticle({ status: "found", article: RICH_FIXTURE_ARTICLE });

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Nền tảng biểu tượng",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Đang tải nội dung bài viết" }),
    ).not.toBeInTheDocument();
  });

  it("should render ArticleNotFound synchronously without calling getArticle or reportError for unknown slug (KB-U49)", () => {
    const getArticleSpy = vi.spyOn(knowledgeContentService, "getArticle");
    const reportSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    renderDetailRoute("/knowledge/slug-khong-ton-tai");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Không tìm thấy bài viết",
      }),
    ).toBeInTheDocument();
    expect(getArticleSpy).not.toHaveBeenCalled();
    expect(reportSpy).not.toHaveBeenCalled();
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute("content"),
    ).toBe("noindex");
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("should render ArticleNotFound and reportError once for content-error missing-file and empty-content (KB-U49, AC-F6.4-A04)", async () => {
    const reportSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    vi.spyOn(knowledgeContentService, "getArticleMetadata").mockReturnValue(
      RICH_FIXTURE_ARTICLE,
    );
    vi.spyOn(knowledgeContentService, "getArticle").mockResolvedValueOnce({
      status: "content-error",
      slug: "what-is-astrology",
      reason: "missing-file",
    });

    const first = renderDetailRoute("/knowledge/what-is-astrology");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Không tìm thấy bài viết",
      }),
    ).toBeInTheDocument();
    expect(reportSpy).toHaveBeenCalledTimes(1);
    expect(reportSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "knowledge-article:missing-file",
    );

    first.unmount();
    reportSpy.mockClear();

    vi.spyOn(knowledgeContentService, "getArticle").mockResolvedValueOnce({
      status: "content-error",
      slug: "what-is-astrology",
      reason: "empty-content",
    });

    renderDetailRoute("/knowledge/what-is-astrology");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Không tìm thấy bài viết",
      }),
    ).toBeInTheDocument();
    expect(reportSpy).toHaveBeenCalledTimes(1);
    expect(reportSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "knowledge-article:empty-content",
    );
  });

  it("should render retryable error state (not Not Found), call reportError once, and recover on retry click for load-failed (KB-U49, KB-A10)", async () => {
    const user = userEvent.setup();
    const reportSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    vi.spyOn(knowledgeContentService, "getArticleMetadata").mockReturnValue(
      RICH_FIXTURE_ARTICLE,
    );
    const getArticleSpy = vi
      .spyOn(knowledgeContentService, "getArticle")
      .mockResolvedValueOnce({
        status: "content-error",
        slug: "what-is-astrology",
        reason: "load-failed",
        cause: new Error("Network timeout"),
      })
      .mockResolvedValueOnce({
        status: "found",
        article: RICH_FIXTURE_ARTICLE,
      });

    const { container } = renderDetailRoute("/knowledge/what-is-astrology");

    // Keeps article h1 and displays retryable error EmptyState (h2), NOT ArticleNotFound
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Không thể tải bài viết",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Chiêm tinh học là gì?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Đã xảy ra lỗi khi tải nội dung. Vui lòng thử lại."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Không tìm thấy bài viết" }),
    ).not.toBeInTheDocument();

    expect(reportSpy).toHaveBeenCalledTimes(1);
    expect(reportSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Network timeout" }),
      "knowledge-article:load-failed",
    );

    // Zero axe violations on error state (KB-A10)
    const errorAxe = await axe(container);
    expect(errorAxe).toHaveNoViolations();

    // Retry recovers to full article view
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Nền tảng biểu tượng",
      }),
    ).toBeInTheDocument();
    expect(getArticleSpy).toHaveBeenCalledTimes(2);
  });

  it("should switch content, update metadata, and scroll to top on article A -> article B navigation (KB-U52, D-F6.4-06)", async () => {
    const user = userEvent.setup();
    const articles = new Map([
      [RICH_FIXTURE_ARTICLE.slug, RICH_FIXTURE_ARTICLE],
      [SECOND_FIXTURE_ARTICLE.slug, SECOND_FIXTURE_ARTICLE],
    ]);

    vi.spyOn(knowledgeContentService, "getArticleMetadata").mockImplementation(
      (slug) => articles.get(slug),
    );
    vi.spyOn(knowledgeContentService, "getArticle").mockImplementation(
      async (slug) => {
        const found = articles.get(slug);
        if (!found) return { status: "not-found", slug };
        return { status: "found", article: found };
      },
    );

    renderDetailRoute("/knowledge/what-is-astrology");

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Nền tảng biểu tượng",
      }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Chiêm tinh học là gì? — AstroViet");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    // Click internal link to article B
    await user.click(screen.getByRole("link", { name: "Hành tinh Mặt Trời" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Mặt Trời trong bản đồ sao",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Vai trò của Mặt Trời",
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe("Mặt Trời trong bản đồ sao — AstroViet");
    });
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });

  it("should have zero accessibility violations on loaded rich article detail page (KB-A08, axe)", async () => {
    vi.spyOn(knowledgeContentService, "getArticleMetadata").mockReturnValue(
      RICH_FIXTURE_ARTICLE,
    );
    vi.spyOn(knowledgeContentService, "getArticle").mockResolvedValue({
      status: "found",
      article: RICH_FIXTURE_ARTICLE,
    });

    const { container } = renderDetailRoute("/knowledge/what-is-astrology");

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Nền tảng biểu tượng",
      }),
    ).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
