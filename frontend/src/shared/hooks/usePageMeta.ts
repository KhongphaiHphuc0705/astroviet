import { useEffect } from "react";

export interface PageMetaOpenGraph {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly url?: string;
}

export interface PageMeta {
  readonly title: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
  readonly robots?: "noindex";
  readonly openGraph?: PageMetaOpenGraph;
}

interface ManagedTagRecord {
  readonly element: Element;
  readonly existed: boolean;
  readonly valueAttr: "content" | "href";
  readonly previousValue: string | null;
}

const PRERENDERED_ATTR = "data-prerendered";
const BASE_TITLE_ATTR = "data-base-title";

function upsertHeadTag(
  tagName: "meta" | "link",
  matchAttr: "name" | "property" | "rel",
  matchValue: string,
  valueAttr: "content" | "href",
  value: string,
  records: ManagedTagRecord[],
): void {
  const existing = document.head.querySelector(
    `${tagName}[${matchAttr}="${matchValue}"]`,
  );

  if (existing) {
    // Tags stamped with `data-prerendered` belong to a prerendered KB route (D-F6.5-06):
    // adopt them as hook-owned so cleanup removes them instead of restoring stale KB metadata.
    const isPrerendered = existing.hasAttribute(PRERENDERED_ATTR);
    if (isPrerendered) {
      existing.removeAttribute(PRERENDERED_ATTR);
      existing.setAttribute(valueAttr, value);
      records.push({
        element: existing,
        existed: false,
        valueAttr,
        previousValue: null,
      });
      return;
    }

    records.push({
      element: existing,
      existed: true,
      valueAttr,
      previousValue: existing.getAttribute(valueAttr),
    });
    existing.setAttribute(valueAttr, value);
    return;
  }

  const created = document.createElement(tagName);
  created.setAttribute(matchAttr, matchValue);
  created.setAttribute(valueAttr, value);
  document.head.appendChild(created);
  records.push({
    element: created,
    existed: false,
    valueAttr,
    previousValue: null,
  });
}

/**
 * Manages document `<head>` metadata (`title`, `description`, `canonical`, `robots`,
 * and Open Graph tags) with automatic cleanup/restoration on route change or unmount
 * (D-F6.4-02, AC-F6.4-A02, AC-F6.4-A03).
 *
 * - Strictly SSR-safe: DOM mutations only run inside `useEffect`.
 * - Tracks primitive field values in effect dependencies to avoid redundant DOM churn.
 * - Intentionally omits `og:image` (D-F6-D1).
 */
export function usePageMeta(meta: PageMeta | null): void {
  const hasMeta = meta !== null;
  const title = meta?.title;
  const description = meta?.description;
  const canonicalUrl = meta?.canonicalUrl;
  const robots = meta?.robots;
  const ogType = meta?.openGraph?.type;
  const ogTitle = meta?.openGraph?.title;
  const ogDescription = meta?.openGraph?.description;
  const ogUrl = meta?.openGraph?.url;

  useEffect(() => {
    if (!hasMeta || title === undefined || typeof document === "undefined") {
      return;
    }

    const titleEl = document.head.querySelector("title");
    const baseTitle = titleEl?.getAttribute(BASE_TITLE_ATTR);
    const previousTitle =
      baseTitle !== null && baseTitle !== undefined
        ? baseTitle
        : document.title;
    if (baseTitle !== null && baseTitle !== undefined) {
      titleEl?.removeAttribute(BASE_TITLE_ATTR);
    }

    const records: ManagedTagRecord[] = [];

    document.title = title;

    if (description !== undefined) {
      upsertHeadTag(
        "meta",
        "name",
        "description",
        "content",
        description,
        records,
      );
    }

    if (canonicalUrl !== undefined) {
      upsertHeadTag("link", "rel", "canonical", "href", canonicalUrl, records);
    }

    if (robots !== undefined) {
      upsertHeadTag("meta", "name", "robots", "content", robots, records);
    }

    if (ogType !== undefined) {
      upsertHeadTag("meta", "property", "og:type", "content", ogType, records);
    }

    if (ogTitle !== undefined) {
      upsertHeadTag(
        "meta",
        "property",
        "og:title",
        "content",
        ogTitle,
        records,
      );
    }

    if (ogDescription !== undefined) {
      upsertHeadTag(
        "meta",
        "property",
        "og:description",
        "content",
        ogDescription,
        records,
      );
    }

    if (ogUrl !== undefined) {
      upsertHeadTag("meta", "property", "og:url", "content", ogUrl, records);
    }

    // Remove any unclaimed prerendered tags (e.g. canonical/og:url when transitioning
    // to a state like NotFound or production without VITE_SITE_URL).
    document.head
      .querySelectorAll(
        `meta[${PRERENDERED_ATTR}], link[rel="canonical"][${PRERENDERED_ATTR}]`,
      )
      .forEach((el) => el.remove());

    return () => {
      document.title = previousTitle;
      for (let i = records.length - 1; i >= 0; i--) {
        const record = records[i];
        if (!record) continue;
        if (!record.existed) {
          record.element.remove();
        } else if (record.previousValue === null) {
          record.element.removeAttribute(record.valueAttr);
        } else {
          record.element.setAttribute(record.valueAttr, record.previousValue);
        }
      }
    };
  }, [
    hasMeta,
    title,
    description,
    canonicalUrl,
    robots,
    ogType,
    ogTitle,
    ogDescription,
    ogUrl,
  ]);
}
