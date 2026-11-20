export type ClassifiedLink =
  | {
      readonly type: "internal-article";
      readonly slug: string;
      readonly to: string;
    }
  | { readonly type: "internal-list"; readonly to: "/knowledge" }
  | { readonly type: "external"; readonly href: string }
  | { readonly type: "rejected"; readonly reason: string };

export type ClassifiedImage =
  | { readonly type: "local"; readonly src: string }
  | { readonly type: "rejected"; readonly reason: string };

/* eslint-disable no-control-regex */
const HOSTILE_CHARS_REGEX =
  /[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]/;
/* eslint-enable no-control-regex */

const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

const INTERNAL_ARTICLE_REGEX = /^\/knowledge\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function classifyLinkHref(
  rawHref: string | undefined,
  isKnownSlug: (slug: string) => boolean,
): ClassifiedLink {
  if (!rawHref || typeof rawHref !== "string") {
    return { type: "rejected", reason: "empty-link" };
  }

  if (rawHref.length > 2048) {
    return { type: "rejected", reason: "url-too-long" };
  }

  if (HOSTILE_CHARS_REGEX.test(rawHref)) {
    return { type: "rejected", reason: "invalid-characters" };
  }

  if (rawHref.startsWith("//") || rawHref.startsWith("\\")) {
    return { type: "rejected", reason: "protocol-relative" };
  }

  if (
    rawHref.startsWith("#") ||
    rawHref.startsWith("./") ||
    rawHref.startsWith("../") ||
    rawHref.startsWith("?")
  ) {
    return { type: "rejected", reason: "unsupported-relative" };
  }

  if (SCHEME_REGEX.test(rawHref)) {
    const colonIndex = rawHref.indexOf(":");
    const scheme = rawHref.slice(0, colonIndex).toLowerCase();

    if (scheme !== "https") {
      return { type: "rejected", reason: "unsupported-scheme" };
    }

    try {
      const parsed = new URL(rawHref);

      if (parsed.protocol !== "https:") {
        return { type: "rejected", reason: "unsupported-scheme" };
      }

      if (parsed.username || parsed.password) {
        return { type: "rejected", reason: "credentials-not-allowed" };
      }

      if (!parsed.hostname || parsed.hostname.length === 0) {
        return { type: "rejected", reason: "missing-hostname" };
      }

      return { type: "external", href: parsed.toString() };
    } catch {
      return { type: "rejected", reason: "malformed-url" };
    }
  }

  if (rawHref === "/knowledge") {
    return { type: "internal-list", to: "/knowledge" };
  }

  const articleMatch = INTERNAL_ARTICLE_REGEX.exec(rawHref);
  if (articleMatch) {
    const slug = articleMatch[1];
    if (slug && isKnownSlug(slug)) {
      return { type: "internal-article", slug, to: `/knowledge/${slug}` };
    }
    return { type: "rejected", reason: "broken-internal" };
  }

  return { type: "rejected", reason: "unsupported-relative" };
}

const LOCAL_IMAGE_REGEX =
  /^\/knowledge\/images\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\.(png|jpe?g|webp|avif)$/i;

const FORBIDDEN_IMAGE_CHARS_REGEX = /[%?#\\]|\.\.|\/\//;

export function classifyImageSrc(rawSrc: string | undefined): ClassifiedImage {
  if (!rawSrc || typeof rawSrc !== "string") {
    return { type: "rejected", reason: "empty-src" };
  }

  if (rawSrc.length > 2048) {
    return { type: "rejected", reason: "src-too-long" };
  }

  if (HOSTILE_CHARS_REGEX.test(rawSrc)) {
    return { type: "rejected", reason: "invalid-path" };
  }

  if (!rawSrc.startsWith("/knowledge/images/")) {
    return { type: "rejected", reason: "unsupported-image-source" };
  }

  if (FORBIDDEN_IMAGE_CHARS_REGEX.test(rawSrc)) {
    return { type: "rejected", reason: "invalid-path" };
  }

  if (LOCAL_IMAGE_REGEX.test(rawSrc)) {
    return { type: "local", src: rawSrc };
  }

  return { type: "rejected", reason: "unsupported-image-source" };
}

const FILENAME_EXTENSION_REGEX = /\.(png|jpe?g|webp|avif)$/i;

export function validateImageAlt(rawAlt: string | undefined): boolean {
  if (!rawAlt || typeof rawAlt !== "string") {
    return false;
  }

  const trimmed = rawAlt.trim();
  if (trimmed.length < 3 || trimmed.length > 200) {
    return false;
  }

  if (FILENAME_EXTENSION_REGEX.test(trimmed)) {
    return false;
  }

  return true;
}

export function normalizeHeadingLevel(level: number): {
  readonly renderAs: "h2" | "h3" | "h4";
  readonly originalLevel?: number;
} {
  switch (level) {
    case 1:
      return { renderAs: "h2", originalLevel: 1 };
    case 2:
      return { renderAs: "h2" };
    case 3:
      return { renderAs: "h3" };
    case 4:
      return { renderAs: "h4" };
    case 5:
      return { renderAs: "h4", originalLevel: 5 };
    case 6:
      return { renderAs: "h4", originalLevel: 6 };
    default:
      return { renderAs: "h4" };
  }
}
