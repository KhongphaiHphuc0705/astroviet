/**
 * Canonical route paths and route helpers for the Knowledge Base feature.
 */

export const KNOWLEDGE_LIST_PATH = "/knowledge" as const;

export function knowledgeArticlePath(slug: string): string {
  return `/knowledge/${slug}`;
}
