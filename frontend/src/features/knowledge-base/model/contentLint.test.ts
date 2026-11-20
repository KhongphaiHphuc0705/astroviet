/// <reference types="node" />
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  checkL1RawHtml,
  checkL4GfmSyntax,
  checkRenderedDom,
  lintArticleContent,
} from "../../../test/helpers/knowledge-base-lint";

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
