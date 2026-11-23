import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import * as reportErrorModule from "@shared/lib/report-error";

import type { KnowledgeArticleMetadata } from "../model/types";

import { KnowledgeArticleHeader } from "./KnowledgeArticleHeader";

describe("KnowledgeArticleHeader", () => {
  const sampleArticle: Pick<
    KnowledgeArticleMetadata,
    "slug" | "title" | "category" | "updatedAt"
  > = {
    slug: "what-is-astrology",
    title: "Chiêm tinh học là gì?",
    category: "fundamentals",
    updatedAt: "2026-11-19",
  };

  it("renders back-link, category badge, single h1, and high-contrast formatted updated date", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleHeader article={sampleArticle} />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", { name: "Tất cả bài viết" });
    expect(backLink).toHaveAttribute("href", "/knowledge");
    expect(backLink).toHaveTextContent("←Tất cả bài viết");

    expect(screen.getByText("Khái niệm cơ bản")).toBeInTheDocument();

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Chiêm tinh học là gì?");

    const timeEl = container.querySelector("time");
    expect(timeEl).toBeInTheDocument();
    expect(timeEl).toHaveAttribute("dateTime", "2026-11-19");
    expect(timeEl).toHaveTextContent("19/11/2026");
    expect(timeEl?.parentElement).toHaveTextContent("Cập nhật 19/11/2026");
    expect(timeEl?.parentElement).toHaveClass("text-secondary");
  });

  it("hides date line and calls reportError once when updatedAt is invalid", () => {
    const reportSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    const invalidArticle = {
      ...sampleArticle,
      updatedAt: "2026-02-30",
    };

    const { container, rerender } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleHeader article={invalidArticle} />
      </MemoryRouter>,
    );

    expect(container.querySelector("time")).toBeNull();
    expect(screen.queryByText(/Cập nhật/)).not.toBeInTheDocument();
    expect(reportSpy).toHaveBeenCalledTimes(1);
    expect(reportSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "knowledge-article:invalid-updated-at",
    );

    rerender(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleHeader article={invalidArticle} />
      </MemoryRouter>,
    );
    expect(reportSpy).toHaveBeenCalledTimes(1);

    reportSpy.mockRestore();
  });

  it("has zero accessibility violations (axe)", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/what-is-astrology"]}>
        <KnowledgeArticleHeader article={sampleArticle} />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
