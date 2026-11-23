import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";

import { knowledgeContentService } from "../model/knowledgeContentService";

import { useKnowledgeArticle } from "./useKnowledgeArticle";

function createWrapper() {
  const queryClient = createQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useKnowledgeArticle (D-F6.4-05)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not call getArticle when enabled is false", () => {
    const spy = vi.spyOn(knowledgeContentService, "getArticle");

    const { result } = renderHook(
      () => useKnowledgeArticle("unknown-slug", false),
      { wrapper: createWrapper() },
    );

    expect(spy).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should resolve found article when slug exists and enabled is true", async () => {
    const { result } = renderHook(
      () => useKnowledgeArticle("what-is-astrology", true),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.status).toBe("found");
    if (result.current.data?.status === "found") {
      expect(result.current.data.article.slug).toBe("what-is-astrology");
      expect(result.current.data.article.markdown.length).toBeGreaterThan(0);
    }
  });

  it("should load distinct results without leaking previous article when slug changes", async () => {
    const spy = vi
      .spyOn(knowledgeContentService, "getArticle")
      .mockImplementation(async (slug) => ({
        status: "found",
        article: {
          slug,
          title: `Article ${slug}`,
          category: "fundamentals",
          summary: `Summary ${slug}`,
          order: 1,
          updatedAt: "2026-11-20",
          markdown: `## Heading ${slug}`,
        },
      }));

    const { result, rerender } = renderHook(
      ({ slug }) => useKnowledgeArticle(slug, true),
      {
        wrapper: createWrapper(),
        initialProps: { slug: "article-a" },
      },
    );

    await waitFor(() => {
      expect(result.current.data?.status).toBe("found");
    });
    if (result.current.data?.status === "found") {
      expect(result.current.data.article.title).toBe("Article article-a");
    }

    rerender({ slug: "article-b" });

    await waitFor(() => {
      expect(
        result.current.data?.status === "found" &&
          result.current.data.article.slug === "article-b",
      ).toBe(true);
    });
    expect(spy).toHaveBeenCalledWith("article-a");
    expect(spy).toHaveBeenCalledWith("article-b");
  });
});
