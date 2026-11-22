export const knowledgeKeys = {
  all: () => ["knowledge"] as const,
  articles: () => ["knowledge", "article"] as const,
  article: (slug: string) => ["knowledge", "article", slug] as const,
};
