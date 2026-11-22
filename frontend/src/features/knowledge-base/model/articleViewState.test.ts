import { describe, expect, it } from "vitest";

import { classifyArticleResult } from "./articleViewState";
import type { KnowledgeArticle } from "./types";

const sampleArticle: KnowledgeArticle = {
  slug: "what-is-astrology",
  title: "Chiêm tinh học là gì?",
  category: "fundamentals",
  summary: "Tổng quan về chiêm tinh học phương Tây.",
  order: 1,
  updatedAt: "2026-11-19",
  markdown: "## Khái niệm\n\nNội dung bài viết.",
};

describe("classifyArticleResult (D-F6.4-04, KB-U49)", () => {
  it("should return kind 'article' when status is 'found'", () => {
    const classified = classifyArticleResult({
      status: "found",
      article: sampleArticle,
    });

    expect(classified).toEqual({
      kind: "article",
      article: sampleArticle,
    });
  });

  it("should return kind 'not-found' without error report when status is 'not-found'", () => {
    const classified = classifyArticleResult({
      status: "not-found",
      slug: "unknown-slug",
    });

    expect(classified).toEqual({
      kind: "not-found",
      slug: "unknown-slug",
    });
    expect(
      "report" in classified ? classified.report : undefined,
    ).toBeUndefined();
  });

  it("should return kind 'not-found' with missing-file report when content-error reason is 'missing-file'", () => {
    const classified = classifyArticleResult({
      status: "content-error",
      slug: "broken-entry",
      reason: "missing-file",
    });

    expect(classified.kind).toBe("not-found");
    if (classified.kind === "not-found") {
      expect(classified.slug).toBe("broken-entry");
      expect(classified.report?.context).toBe("knowledge-article:missing-file");
      expect(classified.report?.error).toBeInstanceOf(Error);
    }
  });

  it("should return kind 'not-found' with empty-content report when content-error reason is 'empty-content'", () => {
    const classified = classifyArticleResult({
      status: "content-error",
      slug: "empty-entry",
      reason: "empty-content",
    });

    expect(classified.kind).toBe("not-found");
    if (classified.kind === "not-found") {
      expect(classified.slug).toBe("empty-entry");
      expect(classified.report?.context).toBe(
        "knowledge-article:empty-content",
      );
      expect(classified.report?.error).toBeInstanceOf(Error);
    }
  });

  it("should return kind 'error' preserving Error cause when content-error reason is 'load-failed'", () => {
    const networkError = new Error("Chunk load failed");
    const classified = classifyArticleResult({
      status: "content-error",
      slug: "what-is-astrology",
      reason: "load-failed",
      cause: networkError,
    });

    expect(classified.kind).toBe("error");
    if (classified.kind === "error") {
      expect(classified.slug).toBe("what-is-astrology");
      expect(classified.report.context).toBe("knowledge-article:load-failed");
      expect(classified.report.error).toBe(networkError);
    }
  });

  it("should wrap non-Error cause into an Error when content-error reason is 'load-failed'", () => {
    const classified = classifyArticleResult({
      status: "content-error",
      slug: "what-is-astrology",
      reason: "load-failed",
      cause: "timeout",
    });

    expect(classified.kind).toBe("error");
    if (classified.kind === "error") {
      expect(classified.report.context).toBe("knowledge-article:load-failed");
      expect(classified.report.error).toBeInstanceOf(Error);
      expect(classified.report.error.message).toContain("timeout");
    }
  });
});
