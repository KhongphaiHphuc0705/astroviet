/// <reference types="node" />
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MarkdownRenderer } from "../ui/MarkdownRenderer";

import { knowledgeContentService } from "./knowledgeContentService";
import { KNOWLEDGE_MANIFEST } from "./manifest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(
  __dirname,
  "../../../test/fixtures/knowledge-base/lint",
);

function readFixture(filename: string): string {
  return readFileSync(resolve(FIXTURES_DIR, filename), "utf-8");
}

export interface LintViolation {
  readonly rule: "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
  readonly message: string;
}

export function stripCodeBlocks(markdown: string): string {
  return markdown
    .replace(/(^|\n)```[\s\S]*?```/g, "\n")
    .replace(/`[^`\n]*`/g, "");
}

export function checkL1RawHtml(markdown: string): LintViolation[] {
  const violations: LintViolation[] = [];
  const withoutCode = stripCodeBlocks(markdown);
  // Remove CommonMark autolinks: <https://...>, <http://...>, <mailto:...>, or <user@domain>
  const withoutAutolinks = withoutCode
    .replace(/<(?:https?|mailto):[^>\s]+>/gi, "")
    .replace(/<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>/g, "");

  if (/<!--[\s\S]*?-->/.test(withoutAutolinks)) {
    violations.push({
      rule: "L1",
      message: "Raw HTML comment detected",
    });
  }

  const htmlTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = htmlTagRegex.exec(withoutAutolinks)) !== null) {
    violations.push({
      rule: "L1",
      message: `Raw HTML tag detected: <${match[1]}>`,
    });
  }

  return violations;
}

export function checkL4GfmSyntax(markdown: string): LintViolation[] {
  const violations: LintViolation[] = [];
  const withoutCode = stripCodeBlocks(markdown);

  // Table separator row: |---|---| or |:---|---:| or :--- | ---:
  if (
    /(?:^|\n)\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*(?:\r?\n|$)/m.test(
      withoutCode,
    )
  ) {
    violations.push({
      rule: "L4",
      message: "GFM table syntax detected",
    });
  }

  // Strikethrough: ~~text~~
  if (/(?:^|[^\\])~~[^~\r\n]+~~/.test(withoutCode)) {
    violations.push({
      rule: "L4",
      message: "GFM strikethrough syntax (~~...~~) detected",
    });
  }

  // Task list: - [ ] or - [x]
  if (/(?:^|\n)\s*[-*+]\s+\[[ xX]\]\s+/m.test(withoutCode)) {
    violations.push({
      rule: "L4",
      message: "GFM task list syntax (- [ ]) detected",
    });
  }

  return violations;
}

export function checkRenderedDom(
  markdown: string,
  isKnownSlug: (slug: string) => boolean,
): LintViolation[] {
  const violations: LintViolation[] = [];

  const { container, unmount } = render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(MarkdownRenderer, { markdown, isKnownSlug }),
    ),
  );

  try {
    // L2: No H1/H5/H6 normalized headings
    const normalizedHeadings = container.querySelectorAll(
      "[data-heading-normalized-from]",
    );
    for (const el of Array.from(normalizedHeadings)) {
      const from = el.getAttribute("data-heading-normalized-from");
      violations.push({
        rule: "L2",
        message: `Forbidden heading level normalized from H${from}: "${el.textContent?.trim()}"`,
      });
    }

    // L3: Heading hierarchy
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    );
    if (headings.length > 0) {
      const firstHeading = headings[0];
      const firstTag = firstHeading?.tagName.toUpperCase();
      if (firstTag !== "H2") {
        violations.push({
          rule: "L3",
          message: `Article must start with H2 heading, but starts with ${firstTag}`,
        });
      }

      for (let i = 1; i < headings.length; i++) {
        const prevHeading = headings[i - 1];
        const currHeading = headings[i];
        if (!prevHeading || !currHeading) continue;

        const prevLevel = parseInt(prevHeading.tagName.substring(1), 10);
        const currLevel = parseInt(currHeading.tagName.substring(1), 10);
        if (currLevel - prevLevel > 1) {
          violations.push({
            rule: "L3",
            message: `Heading level skipped: jumped from H${prevLevel} to H${currLevel} ("${currHeading.textContent?.trim()}")`,
          });
        }
      }
    }

    // L5: No link fallbacks
    const linkFallbacks = container.querySelectorAll(
      '[data-kb-fallback^="link:"]',
    );
    for (const el of Array.from(linkFallbacks)) {
      const fallback = el.getAttribute("data-kb-fallback");
      violations.push({
        rule: "L5",
        message: `Broken or unsupported link detected: ${fallback} ("${el.textContent?.trim()}")`,
      });
    }

    // L6: No image fallbacks
    const imageFallbacks = container.querySelectorAll(
      '[data-kb-fallback^="image:"]',
    );
    for (const el of Array.from(imageFallbacks)) {
      const fallback = el.getAttribute("data-kb-fallback");
      violations.push({
        rule: "L6",
        message: `Broken or unsupported image detected: ${fallback}`,
      });
    }
  } finally {
    unmount();
  }

  return violations;
}

export function lintArticleContent(
  markdown: string,
  isKnownSlug: (slug: string) => boolean,
): LintViolation[] {
  return [
    ...checkL1RawHtml(markdown),
    ...checkL4GfmSyntax(markdown),
    ...checkRenderedDom(markdown, isKnownSlug),
  ];
}

describe("Content Linting Rules (KB-U29, L1–L6)", () => {
  const dummyIsKnownSlug = (slug: string) => slug === "what-is-astrology";

  describe("L1: No raw HTML tags", () => {
    it("should catch raw HTML tags and comments in broken fixture", () => {
      const brokenMd = readFixture("l1-raw-html.md");
      const violations = checkL1RawHtml(brokenMd);

      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some((v) => v.message.includes("<div"))).toBe(true);
      expect(violations.some((v) => v.message.includes("<script"))).toBe(true);
    });

    it("should allow autolinks and HTML inside code blocks", () => {
      const safeMd = [
        "## Tiêu đề",
        "Liên hệ <https://astroviet.com> hoặc <contact@astroviet.com>.",
        "Ví dụ code: `<div>inline code</div>`",
        "```html",
        '<span class="code-block">fenced block</span>',
        "```",
      ].join("\n");

      const violations = checkL1RawHtml(safeMd);
      expect(violations).toEqual([]);
    });
  });

  describe("L2: No H1 / H5 / H6 headings", () => {
    it("should catch normalized H1 and H5 in broken fixture", () => {
      const brokenMd = readFixture("l2-forbidden-heading.md");
      const violations = checkRenderedDom(brokenMd, dummyIsKnownSlug);

      const l2Violations = violations.filter((v) => v.rule === "L2");
      expect(l2Violations.length).toBe(2);
      expect(l2Violations.some((v) => v.message.includes("H1"))).toBe(true);
      expect(l2Violations.some((v) => v.message.includes("H5"))).toBe(true);
    });
  });

  describe("L3: Heading hierarchy", () => {
    it("should catch heading level skip (H2 to H4) in broken fixture", () => {
      const brokenMd = readFixture("l3-heading-hierarchy.md");
      const violations = checkRenderedDom(brokenMd, dummyIsKnownSlug);

      const l3Violations = violations.filter((v) => v.rule === "L3");
      expect(l3Violations.length).toBeGreaterThanOrEqual(1);
      expect(
        l3Violations.some((v) => v.message.includes("jumped from H2 to H4")),
      ).toBe(true);
    });

    it("should catch articles that start with non-H2 heading", () => {
      const startH3Md = "### Bắt đầu bằng cấp 3\n\nNội dung.";
      const violations = checkRenderedDom(startH3Md, dummyIsKnownSlug);

      const l3Violations = violations.filter((v) => v.rule === "L3");
      expect(
        l3Violations.some((v) =>
          v.message.includes("Article must start with H2"),
        ),
      ).toBe(true);
    });

    it("should allow climbing back up the heading tree (e.g. H4 to H2)", () => {
      const validTreeMd = [
        "## Mục 1",
        "### Mục 1.1",
        "#### Chi tiết 1.1.1",
        "## Mục 2",
        "### Mục 2.1",
      ].join("\n");

      const violations = checkRenderedDom(validTreeMd, dummyIsKnownSlug);
      const l3Violations = violations.filter((v) => v.rule === "L3");
      expect(l3Violations).toEqual([]);
    });
  });

  describe("L4: No GFM syntax", () => {
    it("should catch table, strikethrough, and task lists in broken fixture", () => {
      const brokenMd = readFixture("l4-gfm-syntax.md");
      const violations = checkL4GfmSyntax(brokenMd);

      expect(violations.length).toBe(3);
      expect(violations.some((v) => v.message.includes("table"))).toBe(true);
      expect(violations.some((v) => v.message.includes("strikethrough"))).toBe(
        true,
      );
      expect(violations.some((v) => v.message.includes("task list"))).toBe(
        true,
      );
    });

    it("should allow GFM syntax inside code blocks", () => {
      const safeWithCode = [
        "## Code minh họa",
        "```markdown",
        "| a | b |",
        "|---|---|",
        "~~gạch ngang~~",
        "- [ ] việc",
        "```",
        "và inline `~~code~~`.",
      ].join("\n");

      const violations = checkL4GfmSyntax(safeWithCode);
      expect(violations).toEqual([]);
    });
  });

  describe("L5: No broken link fallbacks", () => {
    it("should catch broken internal links and unsupported schemes in broken fixture", () => {
      const brokenMd = readFixture("l5-broken-link.md");
      const violations = checkRenderedDom(brokenMd, dummyIsKnownSlug);

      const l5Violations = violations.filter((v) => v.rule === "L5");
      expect(l5Violations.length).toBeGreaterThanOrEqual(2);
      expect(
        l5Violations.some((v) => v.message.includes("link:broken-internal")),
      ).toBe(true);
      expect(
        l5Violations.some((v) => v.message.includes("link:unsupported-scheme")),
      ).toBe(true);
    });
  });

  describe("L6: No broken image fallbacks", () => {
    it("should catch missing alt, missing src, and remote images in broken fixture", () => {
      const brokenMd = readFixture("l6-broken-image.md");
      const violations = checkRenderedDom(brokenMd, dummyIsKnownSlug);

      const l6Violations = violations.filter((v) => v.rule === "L6");
      expect(l6Violations.length).toBeGreaterThanOrEqual(2);
      expect(
        l6Violations.some(
          (v) =>
            v.message.includes("image:unsupported-image-source") ||
            v.message.includes("image:invalid-alt") ||
            v.message.includes("image:invalid-path"),
        ),
      ).toBe(true);
    });
  });

  describe("Production Content Integrity (KB-U29, KB-AC-20, KB-AC-22, KB-AC-25, KB-AC-35)", () => {
    it("should verify all production articles in knowledgeContentService pass L1–L6 with 0 violations", async () => {
      const articles = await knowledgeContentService.listArticles();
      expect(articles.length).toBeGreaterThan(0);

      const knownSlugs = new Set(KNOWLEDGE_MANIFEST.map((meta) => meta.slug));
      const isKnownSlug = (slug: string) => knownSlugs.has(slug);

      for (const meta of articles) {
        const result = await knowledgeContentService.getArticle(meta.slug);
        expect(result.status).toBe("found");

        if (result.status === "found") {
          const violations = lintArticleContent(
            result.article.markdown,
            isKnownSlug,
          );
          expect(violations).toEqual([]);
        }
      }
    });
  });
});
