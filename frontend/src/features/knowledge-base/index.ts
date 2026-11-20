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
