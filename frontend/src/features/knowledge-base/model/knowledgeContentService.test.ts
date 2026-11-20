import { describe, it, expect, vi } from "vitest";

import { VALID_FIXTURE_MANIFEST } from "../../../test/fixtures/knowledge-base/manifests";

import type { ContentRegistry } from "./contentFiles";
import {
  createKnowledgeContentService,
  knowledgeContentService,
  KnowledgeContentIntegrityError,
} from "./knowledgeContentService";
import type { KnowledgeCategory } from "./types";

describe("KnowledgeContentService (KB-U07, KB-U08, KB-U09a, KB-U09b)", () => {
  const createMockRegistry = (
    files: Record<string, string>,
    options?: { failKeys?: string[] },
  ): ContentRegistry => {
    return {
      listKeys: () => Object.keys(files),
      listRawKeys: () => Object.keys(files),
      load: async (_category: KnowledgeCategory, slug: string) => {
        if (options?.failKeys?.includes(slug)) {
          return {
            status: "error",
            cause: new Error(`Failed to load ${slug}`),
          };
        }
        if (slug in files) {
          return { status: "ok", markdown: files[slug] ?? "" };
        }
        return { status: "missing" };
      },
    };
  };

  describe("KB-U07: Content resolution (getArticle found)", () => {
    it("should resolve article metadata and markdown content successfully", async () => {
      const mockFiles: Record<string, string> = {
        "what-is-astrology": "## Nội dung giới thiệu",
      };
      const registry = createMockRegistry(mockFiles);
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const result = await service.getArticle("what-is-astrology");
      expect(result.status).toBe("found");
      if (result.status === "found") {
        expect(result.article.slug).toBe("what-is-astrology");
        expect(result.article.title).toBe("Chiêm tinh học là gì?");
        expect(result.article.category).toBe("fundamentals");
        expect(result.article.markdown).toBe("## Nội dung giới thiệu");
      }
    });

    it("should return metadata synchronously via getArticleMetadata", () => {
      const registry = createMockRegistry({});
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const meta = service.getArticleMetadata("sun-in-astrology");
      expect(meta).toBeDefined();
      expect(meta?.slug).toBe("sun-in-astrology");
      expect(meta?.title).toBe("Mặt Trời trong chiêm tinh");

      const notFoundMeta = service.getArticleMetadata("non-existent");
      expect(notFoundMeta).toBeUndefined();
    });
  });

  describe("KB-U08: Listing articles and filtering by category", () => {
    it("should list all articles in deterministic order", () => {
      const registry = createMockRegistry({});
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const articles = service.listArticles();
      expect(articles).toHaveLength(VALID_FIXTURE_MANIFEST.length);
      expect(articles[0]?.category).toBe("fundamentals");
      expect(articles[1]?.category).toBe("planets");
      expect(articles[2]?.category).toBe("planets");
    });

    it("should filter articles strictly by category", () => {
      const registry = createMockRegistry({});
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const planetArticles = service.listArticles({ category: "planets" });
      expect(planetArticles).toHaveLength(2);
      expect(planetArticles[0]?.slug).toBe("sun-in-astrology");
      expect(planetArticles[1]?.slug).toBe("moon-in-astrology");

      const fundamentalsArticles = service.listArticles({
        category: "fundamentals",
      });
      expect(fundamentalsArticles).toHaveLength(1);
      expect(fundamentalsArticles[0]?.slug).toBe("what-is-astrology");
    });

    it("should throw RangeError when category is invalid", () => {
      const registry = createMockRegistry({});
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      expect(() =>
        service.listArticles({
          category: "invalid-category" as KnowledgeCategory,
        }),
      ).toThrow(RangeError);
    });
  });

  describe("KB-U09a: Handling unknown slugs", () => {
    it("should return not-found without calling registry when slug does not exist in manifest", async () => {
      const loadSpy = vi.fn();
      const registry: ContentRegistry = {
        listKeys: () => [],
        listRawKeys: () => [],
        load: loadSpy,
      };

      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const result = await service.getArticle("completely-unknown-slug");
      expect(result.status).toBe("not-found");
      if (result.status === "not-found") {
        expect(result.slug).toBe("completely-unknown-slug");
      }
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe("KB-U09b: Handling content error cases (distinct from not-found)", () => {
    it("should return content-error missing-file when registry file is missing", async () => {
      const registry = createMockRegistry({}); // empty files
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const result = await service.getArticle("what-is-astrology");
      expect(result.status).toBe("content-error");
      if (result.status === "content-error") {
        expect(result.slug).toBe("what-is-astrology");
        expect(result.reason).toBe("missing-file");
      }
    });

    it("should return content-error load-failed when registry loader fails", async () => {
      const registry = createMockRegistry(
        { "what-is-astrology": "# Sample" },
        { failKeys: ["what-is-astrology"] },
      );
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const result = await service.getArticle("what-is-astrology");
      expect(result.status).toBe("content-error");
      if (result.status === "content-error") {
        expect(result.slug).toBe("what-is-astrology");
        expect(result.reason).toBe("load-failed");
        expect(result.cause).toBeDefined();
      }
    });

    it("should return content-error empty-content when file contains only whitespace", async () => {
      const registry = createMockRegistry({
        "what-is-astrology": "   \n\n   \t  ",
      });
      const service = createKnowledgeContentService({
        manifest: VALID_FIXTURE_MANIFEST,
        registry,
      });

      const result = await service.getArticle("what-is-astrology");
      expect(result.status).toBe("content-error");
      if (result.status === "content-error") {
        expect(result.slug).toBe("what-is-astrology");
        expect(result.reason).toBe("empty-content");
      }
    });
  });

  describe("Integrity check on initialization", () => {
    it("should throw KnowledgeContentIntegrityError when instantiated with invalid manifest", () => {
      const registry = createMockRegistry({});
      const brokenManifest = [{ slug: "Invalid_Slug" }];

      expect(() =>
        createKnowledgeContentService({
          manifest: brokenManifest,
          registry,
        }),
      ).toThrow(KnowledgeContentIntegrityError);
    });
  });

  describe("Production instance (knowledgeContentService)", () => {
    it("should be successfully initialized with production manifest and registry", async () => {
      const articles = knowledgeContentService.listArticles();
      expect(articles.length).toBeGreaterThanOrEqual(1);
      expect(articles[0]?.slug).toBe("what-is-astrology");

      const result =
        await knowledgeContentService.getArticle("what-is-astrology");
      expect(result.status).toBe("found");
      if (result.status === "found") {
        expect(result.article.title).toBe("Chiêm tinh học là gì?");
        expect(result.article.markdown).toContain(
          "Khái niệm nền tảng về chiêm tinh học",
        );
      }
    });
  });
});
