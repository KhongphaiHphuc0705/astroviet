import {
  isKnowledgeCategory,
  KNOWLEDGE_CATEGORIES,
  SLUG_PATTERN,
  type KnowledgeArticleMetadata,
  type KnowledgeCategory,
} from "./types";

export interface ParityIssue {
  readonly key: string;
  readonly category?: KnowledgeCategory;
  readonly slug?: string;
  readonly message: string;
}

export interface ContentParityResult {
  readonly missingFiles: readonly ParityIssue[];
  readonly orphanFiles: readonly ParityIssue[];
  readonly malformedKeys: readonly string[];
}

export class KnowledgeContentIntegrityError extends Error {
  readonly code: string;

  constructor(message: string, code = "CONTENT_PARITY_FAILED") {
    super(message);
    this.name = "KnowledgeContentIntegrityError";
    this.code = code;
  }
}

export function contentKeyFor(entry: {
  category: KnowledgeCategory;
  slug: string;
}): string {
  return `content/${entry.category}/${entry.slug}.md`;
}

function compareStringsAscii(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const slugPatternBody = SLUG_PATTERN.source.replace(/^\^|\$$/g, "");

const VALID_KEY_REGEX = new RegExp(
  `^content/(${KNOWLEDGE_CATEGORIES.join("|")})/(${slugPatternBody})\\.md$`,
);

export function normalizeGlobKey(rawKey: string): string | undefined {
  let normalized = rawKey.replace(/\\/g, "/");

  if (normalized.startsWith("../")) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  if (!VALID_KEY_REGEX.test(normalized)) {
    return undefined;
  }

  return normalized;
}

export function checkContentParity(
  manifestEntries: readonly KnowledgeArticleMetadata[],
  globKeys: readonly string[],
): ContentParityResult {
  const missingFiles: ParityIssue[] = [];
  const orphanFiles: ParityIssue[] = [];
  const malformedKeys: string[] = [];
  const normalizedGlobKeySet = new Set<string>();

  for (const rawKey of globKeys) {
    const normalized = normalizeGlobKey(rawKey);
    if (!normalized) {
      malformedKeys.push(rawKey);
    } else {
      normalizedGlobKeySet.add(normalized);
    }
  }

  const manifestKeySet = new Set<string>();

  for (const entry of manifestEntries) {
    const expectedKey = contentKeyFor(entry);
    manifestKeySet.add(expectedKey);

    if (!normalizedGlobKeySet.has(expectedKey)) {
      missingFiles.push({
        key: expectedKey,
        category: entry.category,
        slug: entry.slug,
        message: `Manifest entry "${entry.slug}" expects file "${expectedKey}", but it does not exist.`,
      });
    }
  }

  for (const globKey of normalizedGlobKeySet) {
    if (!manifestKeySet.has(globKey)) {
      const parts = globKey.split("/");
      const categoryCandidate = parts[1];
      const filename = parts[2];
      const slugCandidate = filename?.replace(/\.md$/, "");

      orphanFiles.push({
        key: globKey,
        category:
          categoryCandidate && isKnowledgeCategory(categoryCandidate)
            ? categoryCandidate
            : undefined,
        slug: slugCandidate,
        message: `File "${globKey}" exists in content directory but has no corresponding entry in manifest.`,
      });
    }
  }

  return {
    missingFiles: [...missingFiles].sort((a, b) =>
      compareStringsAscii(a.key, b.key),
    ),
    orphanFiles: [...orphanFiles].sort((a, b) =>
      compareStringsAscii(a.key, b.key),
    ),
    malformedKeys: [...malformedKeys].sort(compareStringsAscii),
  };
}
