import type { KnowledgeArticleMetadata } from "./types";

export const KNOWLEDGE_MANIFEST: readonly KnowledgeArticleMetadata[] = [
  {
    slug: "what-is-astrology",
    title: "Chiêm tinh học là gì?",
    category: "fundamentals",
    summary:
      "Khái niệm tổng quan về chiêm tinh học phương Tây, lịch sử phát triển và góc nhìn hiện đại về bản đồ sao cá nhân.",
    order: 1,
    updatedAt: "2026-11-19",
  },
] as const;
