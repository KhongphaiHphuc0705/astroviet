// Service
export {
  createKnowledgeContentService,
  knowledgeContentService,
} from "./model/knowledgeContentService";
export type { KnowledgeContentService } from "./model/knowledgeContentService";

// Manifest & Validation
export { KNOWLEDGE_MANIFEST } from "./model/manifest";
export {
  compareManifestEntries,
  validateManifest,
} from "./model/validateManifest";
export type {
  ManifestIssue,
  ManifestIssueCode,
  ValidateManifestResult,
} from "./model/validateManifest";

// Content Parity & Integrity (for F6.5 prerender and verification)
export {
  checkContentParity,
  contentKeyFor,
  KnowledgeContentIntegrityError,
  normalizeGlobKey,
} from "./model/contentIntegrity";
export type {
  ContentParityResult,
  ParityIssue,
} from "./model/contentIntegrity";
export { contentRegistry, createContentRegistry } from "./model/contentFiles";
export type { ContentLoadResult, ContentRegistry } from "./model/contentFiles";

// Types & Constants
export {
  isKnowledgeCategory,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
  RESERVED_SLUGS,
  SLUG_PATTERN,
} from "./model/types";
export type {
  KnowledgeArticle,
  KnowledgeArticleContent,
  KnowledgeArticleMetadata,
  KnowledgeArticleResult,
  KnowledgeCategory,
  KnowledgeContentErrorReason,
  ListArticlesOptions,
} from "./model/types";

// SEO
export {
  buildKnowledgeArticleSeo,
  buildKnowledgeListSeo,
  buildKnowledgeNotFoundSeo,
  KNOWLEDGE_LIST_DESCRIPTION,
  KNOWLEDGE_LIST_TITLE,
  KNOWLEDGE_NOT_FOUND_DESCRIPTION,
  KNOWLEDGE_NOT_FOUND_TITLE,
  KnowledgeSeoError,
  normalizeSiteUrl,
  SITE_NAME,
} from "./model/seo";
export type {
  BuildKnowledgeArticleSeoInput,
  BuildKnowledgeListSeoInput,
  KnowledgeSeo,
} from "./model/seo";

// Listing UI & Filter Helpers (F6.3)
export { KnowledgeListView } from "./ui/KnowledgeListView";
export type { KnowledgeListViewProps } from "./ui/KnowledgeListView";
export {
  CATEGORY_FILTER_ALL,
  filterArticlesByCategory,
} from "./model/categoryFilter";
export type { KnowledgeCategoryFilterValue } from "./model/categoryFilter";
export { formatKnowledgeDate } from "./model/formatDate";
export { KNOWLEDGE_LIST_PATH, knowledgeArticlePath } from "./model/routes";

// Article Detail State, Hooks & NotFound (F6.4 — detail reading view stays isolated in lazy route per D-F6.4-03)
export { classifyArticleResult } from "./model/articleViewState";
export type {
  ArticleErrorReport,
  ArticleViewClassification,
} from "./model/articleViewState";
export { knowledgeKeys } from "./hooks/query-keys";
export { useKnowledgeArticle } from "./hooks/useKnowledgeArticle";
export { ArticleNotFound } from "./ui/ArticleNotFound";
export type { ArticleNotFoundProps } from "./ui/ArticleNotFound";
