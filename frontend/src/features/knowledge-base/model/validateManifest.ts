import {
  KNOWLEDGE_CATEGORIES,
  RESERVED_SLUGS,
  SLUG_PATTERN,
  isKnowledgeCategory,
  type KnowledgeArticleMetadata,
} from "./types";

export type ManifestIssueCode =
  | "INVALID_ENTRY"
  | "INVALID_SLUG"
  | "RESERVED_SLUG"
  | "DUPLICATE_SLUG"
  | "INVALID_CATEGORY"
  | "INVALID_TITLE"
  | "INVALID_SUMMARY"
  | "INVALID_ORDER"
  | "INVALID_UPDATED_AT";

export interface ManifestIssue {
  readonly code: ManifestIssueCode;
  readonly index: number;
  readonly slug?: string;
  readonly field?: string;
  readonly message: string;
}

export type ValidateManifestResult =
  | {
      readonly status: "valid";
      readonly entries: readonly KnowledgeArticleMetadata[];
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly ManifestIssue[];
    };

export function compareManifestEntries(
  a: KnowledgeArticleMetadata,
  b: KnowledgeArticleMetadata,
): number {
  const catIndexA = KNOWLEDGE_CATEGORIES.indexOf(a.category);
  const catIndexB = KNOWLEDGE_CATEGORIES.indexOf(b.category);
  if (catIndexA !== catIndexB) {
    return catIndexA - catIndexB;
  }

  if (a.order !== b.order) {
    return a.order - b.order;
  }

  if (a.slug < b.slug) {
    return -1;
  }
  if (a.slug > b.slug) {
    return 1;
  }
  return 0;
}

function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const parts = dateStr.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateManifest(
  entries: readonly unknown[],
): ValidateManifestResult {
  const issues: ManifestIssue[] = [];
  const seenSlugs = new Set<string>();
  const validEntries: KnowledgeArticleMetadata[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      issues.push({
        code: "INVALID_ENTRY",
        index: i,
        message: `Entry at index ${i} is not a valid object.`,
      });
      continue;
    }

    const record = entry as Record<string, unknown>;
    let entryHasError = false;

    // 1. Slug validation
    const slug = record.slug;
    if (
      typeof slug !== "string" ||
      slug.length === 0 ||
      slug.length > 80 ||
      !SLUG_PATTERN.test(slug)
    ) {
      issues.push({
        code: "INVALID_SLUG",
        index: i,
        field: "slug",
        slug: typeof slug === "string" ? slug : undefined,
        message: `Entry at index ${i} has an invalid slug format. Slugs must be lowercase alphanumeric with single hyphens, 1-80 characters.`,
      });
      entryHasError = true;
    } else if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
      issues.push({
        code: "RESERVED_SLUG",
        index: i,
        field: "slug",
        slug,
        message: `Entry at index ${i} uses reserved slug "${slug}".`,
      });
      entryHasError = true;
    } else if (seenSlugs.has(slug)) {
      issues.push({
        code: "DUPLICATE_SLUG",
        index: i,
        field: "slug",
        slug,
        message: `Entry at index ${i} has duplicate slug "${slug}".`,
      });
      entryHasError = true;
    } else {
      seenSlugs.add(slug);
    }

    // 2. Category validation
    const category = record.category;
    if (typeof category !== "string" || !isKnowledgeCategory(category)) {
      issues.push({
        code: "INVALID_CATEGORY",
        index: i,
        field: "category",
        slug: typeof slug === "string" ? slug : undefined,
        message: `Entry at index ${i} has invalid category "${String(category)}". Must be one of: ${KNOWLEDGE_CATEGORIES.join(", ")}.`,
      });
      entryHasError = true;
    }

    // 3. Title validation
    const title = record.title;
    if (
      typeof title !== "string" ||
      title.trim().length === 0 ||
      title.length > 120
    ) {
      issues.push({
        code: "INVALID_TITLE",
        index: i,
        field: "title",
        slug: typeof slug === "string" ? slug : undefined,
        message: `Entry at index ${i} has invalid title. Title must be non-empty and at most 120 characters.`,
      });
      entryHasError = true;
    }

    // 4. Summary validation
    const summary = record.summary;
    if (
      typeof summary !== "string" ||
      summary.trim().length === 0 ||
      summary.length > 160
    ) {
      issues.push({
        code: "INVALID_SUMMARY",
        index: i,
        field: "summary",
        slug: typeof slug === "string" ? slug : undefined,
        message: `Entry at index ${i} has invalid summary. Summary must be non-empty and at most 160 characters.`,
      });
      entryHasError = true;
    }

    // 5. Order validation
    const order = record.order;
    if (typeof order !== "number" || !Number.isInteger(order) || order < 0) {
      issues.push({
        code: "INVALID_ORDER",
        index: i,
        field: "order",
        slug: typeof slug === "string" ? slug : undefined,
        message: `Entry at index ${i} has invalid order. Order must be an integer >= 0.`,
      });
      entryHasError = true;
    }

    // 6. UpdatedAt validation
    const updatedAt = record.updatedAt;
    if (typeof updatedAt !== "string" || !isValidCalendarDate(updatedAt)) {
      issues.push({
        code: "INVALID_UPDATED_AT",
        index: i,
        field: "updatedAt",
        slug: typeof slug === "string" ? slug : undefined,
        message: `Entry at index ${i} has invalid updatedAt date "${String(updatedAt)}". Must be a valid calendar date in YYYY-MM-DD format.`,
      });
      entryHasError = true;
    }

    if (!entryHasError) {
      validEntries.push({
        slug: slug as string,
        title: (title as string).trim(),
        category: category as KnowledgeArticleMetadata["category"],
        summary: (summary as string).trim(),
        order: order as number,
        updatedAt: updatedAt as string,
      });
    }
  }

  if (issues.length > 0) {
    return {
      status: "invalid",
      issues,
    };
  }

  const sortedEntries = [...validEntries].sort(compareManifestEntries);

  return {
    status: "valid",
    entries: sortedEntries,
  };
}
