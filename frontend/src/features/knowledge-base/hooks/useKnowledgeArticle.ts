import { useQuery } from "@tanstack/react-query";

import { knowledgeContentService } from "../model/knowledgeContentService";
import type { KnowledgeArticleResult } from "../model/types";

import { knowledgeKeys } from "./query-keys";

/**
 * Fetches an article's full content (metadata + markdown) via `knowledgeContentService.getArticle`.
 *
 * Uses `staleTime: Infinity` because knowledge base markdown assets are static build-time
 * chunks immutable during a session (D-F6.4-05).
 * Returns the discriminated union `KnowledgeArticleResult` without throwing so callers
 * can classify `found | not-found | content-error` explicitly.
 */
export function useKnowledgeArticle(
  slug: string | undefined,
  enabled: boolean,
) {
  return useQuery<KnowledgeArticleResult>({
    queryKey: knowledgeKeys.article(slug ?? ""),
    queryFn: () => knowledgeContentService.getArticle(slug as string),
    enabled: Boolean(slug) && enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
