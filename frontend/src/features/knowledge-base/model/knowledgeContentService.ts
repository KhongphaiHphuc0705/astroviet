import { contentRegistry, type ContentRegistry } from "./contentFiles";
import { KNOWLEDGE_MANIFEST } from "./manifest";
import {
  KNOWLEDGE_CATEGORIES,
  isKnowledgeCategory,
  type KnowledgeArticleMetadata,
  type KnowledgeArticleResult,
  type ListArticlesOptions,
} from "./types";
import { validateManifest, type ManifestIssue } from "./validateManifest";

export class KnowledgeContentIntegrityError extends Error {
  readonly code = "KNOWLEDGE_CONTENT_INTEGRITY" as const;
  readonly issues: readonly ManifestIssue[];

  constructor(issues: readonly ManifestIssue[]) {
    super(
      `Knowledge content integrity check failed with ${issues.length} issue(s): ${issues
        .map((i) => `[${i.code}] ${i.message}`)
        .join("; ")}`,
    );
    this.name = "KnowledgeContentIntegrityError";
    this.issues = issues;
  }
}

export interface KnowledgeContentService {
  listArticles(
    options?: ListArticlesOptions,
  ): readonly KnowledgeArticleMetadata[];
  getArticleMetadata(slug: string): KnowledgeArticleMetadata | undefined;
  getArticle(slug: string): Promise<KnowledgeArticleResult>;
}

export function createKnowledgeContentService(deps: {
  manifest: readonly unknown[];
  registry: ContentRegistry;
}): KnowledgeContentService {
  const validation = validateManifest(deps.manifest);
  if (validation.status === "invalid") {
    throw new KnowledgeContentIntegrityError(validation.issues);
  }

  const sortedArticles = validation.entries;
  const articlesBySlug = new Map<string, KnowledgeArticleMetadata>();

  for (const article of sortedArticles) {
    articlesBySlug.set(article.slug, article);
  }

  return {
    listArticles(
      options?: ListArticlesOptions,
    ): readonly KnowledgeArticleMetadata[] {
      if (options?.category !== undefined) {
        if (!isKnowledgeCategory(options.category)) {
          throw new RangeError(
            `Invalid category: "${String(options.category)}". Must be one of: ${KNOWLEDGE_CATEGORIES.join(", ")}`,
          );
        }
        return sortedArticles.filter(
          (article) => article.category === options.category,
        );
      }
      return [...sortedArticles];
    },

    getArticleMetadata(slug: string): KnowledgeArticleMetadata | undefined {
      return articlesBySlug.get(slug);
    },

    async getArticle(slug: string): Promise<KnowledgeArticleResult> {
      const metadata = articlesBySlug.get(slug);
      if (!metadata) {
        return {
          status: "not-found",
          slug,
        };
      }

      const loadResult = await deps.registry.load(
        metadata.category,
        metadata.slug,
      );

      if (loadResult.status === "missing") {
        return {
          status: "content-error",
          slug,
          reason: "missing-file",
        };
      }

      if (loadResult.status === "error") {
        return {
          status: "content-error",
          slug,
          reason: "load-failed",
          cause: loadResult.cause,
        };
      }

      if (loadResult.markdown.trim().length === 0) {
        return {
          status: "content-error",
          slug,
          reason: "empty-content",
        };
      }

      return {
        status: "found",
        article: {
          ...metadata,
          markdown: loadResult.markdown,
        },
      };
    },
  };
}

export const knowledgeContentService: KnowledgeContentService =
  createKnowledgeContentService({
    manifest: KNOWLEDGE_MANIFEST,
    registry: contentRegistry,
  });
