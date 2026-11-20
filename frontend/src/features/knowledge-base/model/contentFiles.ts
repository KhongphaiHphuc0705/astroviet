import { contentKeyFor, normalizeGlobKey } from "./contentIntegrity";
import type { KnowledgeCategory } from "./types";

export type ContentLoadResult =
  | { readonly status: "ok"; readonly markdown: string }
  | { readonly status: "missing" }
  | { readonly status: "error"; readonly cause: unknown };

export interface ContentRegistry {
  listKeys(): readonly string[];
  listRawKeys(): readonly string[];
  load(category: KnowledgeCategory, slug: string): Promise<ContentLoadResult>;
}

function compareStringsAscii(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function createContentRegistry(
  glob: Readonly<Record<string, () => Promise<string>>>,
): ContentRegistry {
  const loadersByNormalizedKey = new Map<string, () => Promise<string>>();
  const rawKeys = Object.keys(glob).sort(compareStringsAscii);

  for (const [rawKey, loader] of Object.entries(glob)) {
    const normalized = normalizeGlobKey(rawKey);
    if (normalized) {
      loadersByNormalizedKey.set(normalized, loader);
    }
  }

  const sortedKeys = Array.from(loadersByNormalizedKey.keys()).sort(
    compareStringsAscii,
  );

  return {
    listKeys(): readonly string[] {
      return sortedKeys;
    },

    listRawKeys(): readonly string[] {
      return rawKeys;
    },

    async load(
      category: KnowledgeCategory,
      slug: string,
    ): Promise<ContentLoadResult> {
      const key = contentKeyFor({ category, slug });
      const loader = loadersByNormalizedKey.get(key);

      if (!loader) {
        return { status: "missing" };
      }

      try {
        const raw = await loader();
        const normalized = raw.replace(/\r\n/g, "\n");
        return {
          status: "ok",
          markdown: normalized,
        };
      } catch (err) {
        return {
          status: "error",
          cause: err,
        };
      }
    },
  };
}

export const contentRegistry: ContentRegistry = createContentRegistry(
  import.meta.glob<string>("../content/**/*.md", {
    query: "?raw",
    import: "default",
  }),
);
