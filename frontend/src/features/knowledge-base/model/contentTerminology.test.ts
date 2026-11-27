import { describe, expect, it } from "vitest";

// D-F6-A6 / D-F6.6-06: Import ASPECT_TYPE_LABELS from chart model ONLY in test files
// (never in production knowledge-base code) to keep canonical labels dynamically synced with F6.0b.
import { ASPECT_TYPE_LABELS } from "@features/chart/model/labels";
import { stripCodeBlocks } from "@test/helpers/knowledge-base-lint";

import { knowledgeContentService } from "./knowledgeContentService";
import { KNOWLEDGE_MANIFEST } from "./manifest";

/**
 * Canonical source of truth:
 * - docs/frontend/Frontend_UI_Specification.md §12.11 ("Nguồn chuẩn duy nhất")
 * - frontend/src/features/chart/model/labels.ts (ASPECT_TYPE_LABELS)
 *
 * Legacy forbidden labels checked automatically (D-F6-A5 / D-F6.6-06):
 * - "Vuông chiếu" (replaced by Square -> "Vuông góc")
 * - "Đối xung" (replaced by Opposition -> "Đối đỉnh")
 *
 * Note (D-F6-A5): "Hợp" is intentionally NOT auto-checked here because it occurs
 * legitimately inside standard Vietnamese words ("Lục hợp", "Tam hợp", "phù hợp",
 * "kết hợp", "phối hợp"). Contextual usage of "Hợp" is audited manually via
 * Sprint_F6_Content_Approval_Tracker.md §5 (checklist §7.5).
 */
const LEGACY_ASPECT_ALIAS_RULES = [
  {
    legacy: "Vuông chiếu",
    canonical: ASPECT_TYPE_LABELS.Square.labelVi,
  },
  {
    legacy: "Đối xung",
    canonical: ASPECT_TYPE_LABELS.Opposition.labelVi,
  },
] as const;

const ASPECT_EXACT_DEGREES = {
  Conjunction: "0°",
  Sextile: "60°",
  Square: "90°",
  Trine: "120°",
  Opposition: "180°",
} as const satisfies Record<keyof typeof ASPECT_TYPE_LABELS, string>;

export interface TerminologyViolation {
  readonly code:
    | "LEGACY_LABEL_OUTSIDE_ALIAS"
    | "LEGACY_ALIAS_REPEATED"
    | "MISSING_CANONICAL_CONTEXT"
    | "NON_CANONICAL_NODE_LABEL"
    | "NON_CANONICAL_ANGLE_ABBR"
    | "BARE_ENGLISH_TERM";
  readonly message: string;
}

const FORBIDDEN_VEDIC_NODE_TERMS = ["La Hầu", "Kế Đô"] as const;

const BARE_ENGLISH_PLANET_AND_ANGLE_TERMS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "North Node",
  "South Node",
  "Ascendant",
  "Midheaven",
  "Descendant",
  "Imum Coeli",
] as const;

function stripMarkdownUrlsAndParens(text: string): string {
  // Keep link label text, drop URL targets (which contain English slugs)
  let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Iteratively strip parenthetical expressions (...) where English glosses are permitted
  let prev: string;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/\([^()]*\)/g, "");
  } while (cleaned !== prev);
  return cleaned;
}

function findPlanetAndAngleTerminologyViolations(
  rawText: string,
): TerminologyViolation[] {
  const violations: TerminologyViolation[] = [];
  const textWithoutCode = stripCodeBlocks(rawText);

  // 1. Disallow Vedic/sidereal lunar node names ("La Hầu", "Kế Đô") anywhere in prose
  for (const term of FORBIDDEN_VEDIC_NODE_TERMS) {
    const regex = new RegExp(escapeRegExp(term), "gi");
    const matches = [...textWithoutCode.matchAll(regex)];
    for (const m of matches) {
      violations.push({
        code: "NON_CANONICAL_NODE_LABEL",
        message: `Non-canonical Vedic lunar node label "${m[0]}" detected; use canonical "Nút Bắc" / "Nút Nam" (labels.ts).`,
      });
    }
  }

  // 2. Disallow non-canonical angle abbreviations (AC) / (DC); canonical labels.ts uses ASC / DSC
  for (const match of textWithoutCode.matchAll(/\((AC|DC)\)/g)) {
    violations.push({
      code: "NON_CANONICAL_ANGLE_ABBR",
      message: `Non-canonical angle abbreviation "${match[0]}" detected; use canonical "ASC" / "DSC" (labels.ts).`,
    });
  }

  // 3. Disallow bare English planet/node/angle names outside parenthetical glosses
  const bareProse = stripMarkdownUrlsAndParens(textWithoutCode);
  for (const term of BARE_ENGLISH_PLANET_AND_ANGLE_TERMS) {
    const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, "g");
    const matches = [...bareProse.matchAll(regex)];
    for (const m of matches) {
      violations.push({
        code: "BARE_ENGLISH_TERM",
        message: `Bare English term "${m[0]}" found outside parentheses; use canonical Vietnamese label from labels.ts with optional English gloss in parentheses.`,
      });
    }
  }

  return violations;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scans prose (outside fenced/inline code blocks per KB-U22-e policy) for
 * deprecated aspect labels ("Vuông chiếu", "Đối xung").
 *
 * Policy:
 * - Code blocks (fenced ``` and inline `) are stripped before scanning so
 *   technical/code examples do not trigger false positives (KB-U22-e).
 * - Outside code blocks, a deprecated label is ONLY allowed inside a parenthetical
 *   alias clause paired immediately with its exact canonical label, using one of
 *   the approved introducers ("còn gọi là", "hay gọi là", "tên gọi khác là"),
 *   and at most ONCE per article (first introduction per F6 plan §11.1 #14).
 */
function findLegacyAspectLabelViolations(
  rawText: string,
  options: { readonly allowFirstIntroAlias: boolean },
): TerminologyViolation[] {
  const violations: TerminologyViolation[] = [];
  const textWithoutCode = stripCodeBlocks(rawText);

  for (const rule of LEGACY_ASPECT_ALIAS_RULES) {
    const legacyRegex = new RegExp(escapeRegExp(rule.legacy), "gi");
    const validAliasRegex = new RegExp(
      `${escapeRegExp(rule.canonical)}\\s*\\([^()]*?(?:còn gọi là|hay gọi là|tên gọi khác là)\\s+[""«']?${escapeRegExp(rule.legacy)}[""»']?[^()]*?\\)`,
      "gi",
    );

    const validMatches = [...textWithoutCode.matchAll(validAliasRegex)];

    if (options.allowFirstIntroAlias && validMatches.length > 1) {
      violations.push({
        code: "LEGACY_ALIAS_REPEATED",
        message: `Alias for legacy label "${rule.legacy}" appears ${validMatches.length} times; only a single first-introduction alias is permitted.`,
      });
    }

    const textToScan = options.allowFirstIntroAlias
      ? textWithoutCode.replace(validAliasRegex, rule.canonical)
      : textWithoutCode;

    const strayMatches = [...textToScan.matchAll(legacyRegex)];
    for (const match of strayMatches) {
      violations.push({
        code: "LEGACY_LABEL_OUTSIDE_ALIAS",
        message: `Forbidden legacy aspect label "${match[0]}" found outside an approved first-introduction alias for "${rule.canonical}".`,
      });
    }
  }

  return violations;
}

/**
 * Verifies that every canonical aspect label from ASPECT_TYPE_LABELS appears
 * paired with its exact degree (0°, 60°, 90°, 120°, 180°) inside the same
 * logical Markdown block (heading, list item, or paragraph) — preventing false
 * passes where labels and degrees are scattered across unrelated sections.
 */
function findMissingMajorAspectContexts(
  markdown: string,
): TerminologyViolation[] {
  const violations: TerminologyViolation[] = [];
  const textWithoutCode = stripCodeBlocks(markdown);

  // Split into non-empty lines/blocks (headings, list items, paragraphs)
  const blocks = textWithoutCode
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const [aspectKey, meta] of Object.entries(ASPECT_TYPE_LABELS) as Array<
    [keyof typeof ASPECT_TYPE_LABELS, { readonly labelVi: string }]
  >) {
    const expectedDegree = ASPECT_EXACT_DEGREES[aspectKey];
    const hasContextualPair = blocks.some(
      (block) => block.includes(meta.labelVi) && block.includes(expectedDegree),
    );

    if (!hasContextualPair) {
      violations.push({
        code: "MISSING_CANONICAL_CONTEXT",
        message: `Canonical label "${meta.labelVi}" (${aspectKey}) is not paired with exact degree "${expectedDegree}" in the same heading, list item, or paragraph.`,
      });
    }
  }

  return violations;
}

describe("Knowledge Base Aspect Terminology Verification (KB-U22, KB-U23)", () => {
  describe("KB-U22: Deprecated aspect labels detection & alias rules (UI Spec §12.11)", () => {
    it("U22-c: allows a single valid first-introduction alias paired with its canonical label", () => {
      const validFixture = [
        "## Năm góc chiếu chính",
        "",
        "- **Vuông góc (Square, 90°, còn gọi là Vuông chiếu):** Góc chiếu căng thẳng thúc đẩy hành động.",
        "- **Đối đỉnh (Opposition, 180°, hay gọi là Đối xung):** Góc chiếu đối cực đòi hỏi sự cân bằng.",
      ].join("\n");

      expect(
        findLegacyAspectLabelViolations(validFixture, {
          allowFirstIntroAlias: true,
        }),
      ).toEqual([]);
    });

    it("U22-d: fails on legacy labels outside alias, mismatched canonical pairs, or repeated aliases", () => {
      const bareLegacyFixture =
        "## Góc chiếu\n\nGóc Vuông chiếu tạo áp lực và góc Đối xung gây giằng co.";
      const bareViolations = findLegacyAspectLabelViolations(
        bareLegacyFixture,
        { allowFirstIntroAlias: true },
      );
      expect(bareViolations).toHaveLength(2);
      expect(
        bareViolations.every((v) => v.code === "LEGACY_LABEL_OUTSIDE_ALIAS"),
      ).toBe(true);

      const wrongCanonicalFixture =
        "## Góc chiếu\n\nTam hợp (còn gọi là Đối xung) là cặp ghép sai.";
      const wrongPairViolations = findLegacyAspectLabelViolations(
        wrongCanonicalFixture,
        { allowFirstIntroAlias: true },
      );
      expect(wrongPairViolations).toHaveLength(1);
      expect(wrongPairViolations[0]?.code).toBe("LEGACY_LABEL_OUTSIDE_ALIAS");

      const repeatedAliasFixture = [
        "## Lần 1",
        "Đối đỉnh (còn gọi là Đối xung) là góc 180°.",
        "## Lần 2",
        "Nhắc lại Đối đỉnh (hay gọi là Đối xung) ở mục sau là sai quy tắc.",
      ].join("\n");
      const repeatedViolations = findLegacyAspectLabelViolations(
        repeatedAliasFixture,
        { allowFirstIntroAlias: true },
      );
      expect(
        repeatedViolations.some((v) => v.code === "LEGACY_ALIAS_REPEATED"),
      ).toBe(true);
    });

    it("U22-e: ignores legacy labels inside fenced/inline code blocks while catching them in prose", () => {
      const codeExemptFixture = [
        "## Ghi chú kỹ thuật",
        "",
        "Ví dụ inline `Vuông chiếu` và khối mã:",
        "```text",
        "Legacy term: Đối xung",
        "```",
        "",
        "Trong văn bản chính thức luôn dùng Vuông góc và Đối đỉnh.",
      ].join("\n");

      expect(
        findLegacyAspectLabelViolations(codeExemptFixture, {
          allowFirstIntroAlias: true,
        }),
      ).toEqual([]);

      const mixedProseAndCodeFixture = `${codeExemptFixture}\n\nNhãn Đối xung rơi ra ngoài văn bản thường phải bị bắt.`;
      const mixedViolations = findLegacyAspectLabelViolations(
        mixedProseAndCodeFixture,
        { allowFirstIntroAlias: true },
      );
      expect(mixedViolations).toHaveLength(1);
      expect(mixedViolations[0]?.code).toBe("LEGACY_LABEL_OUTSIDE_ALIAS");
    });

    it("U22-a: scans title and summary of every manifest entry for zero forbidden legacy labels", () => {
      expect(KNOWLEDGE_MANIFEST.length).toBeGreaterThan(0);

      for (const entry of KNOWLEDGE_MANIFEST) {
        const titleViolations = findLegacyAspectLabelViolations(entry.title, {
          allowFirstIntroAlias: false,
        });
        const summaryViolations = findLegacyAspectLabelViolations(
          entry.summary,
          { allowFirstIntroAlias: false },
        );

        expect(
          titleViolations,
          `Manifest title for "${entry.slug}" contains forbidden legacy aspect label`,
        ).toEqual([]);
        expect(
          summaryViolations,
          `Manifest summary for "${entry.slug}" contains forbidden legacy aspect label`,
        ).toEqual([]);
      }
    });

    it("U22-b: scans body markdown of all production articles for zero forbidden legacy labels outside approved first-intro alias", async () => {
      const articles = await knowledgeContentService.listArticles();
      expect(articles.length).toBeGreaterThan(0);

      for (const meta of articles) {
        const result = await knowledgeContentService.getArticle(meta.slug);
        expect(result.status).toBe("found");

        if (result.status === "found") {
          const violations = findLegacyAspectLabelViolations(
            result.article.markdown,
            { allowFirstIntroAlias: true },
          );
          expect(
            violations,
            `Article "${meta.slug}" has terminology violations`,
          ).toEqual([]);
        }
      }
    });
  });

  describe("KB-U23: Canonical 5 aspect labels from ASPECT_TYPE_LABELS in real aspect articles", () => {
    it("U23-b (negative fixture): rejects article where canonical labels are detached from their exact degrees", () => {
      const scatteredFixture = [
        "## Danh sách nhãn",
        "Trùng tụ, Lục hợp, Vuông góc, Tam hợp, Đối đỉnh.",
        "## Các con số",
        "Các góc gồm 0°, 60°, 90°, 120°, 180° nhưng không ghép cùng tên góc.",
      ].join("\n");

      const violations = findMissingMajorAspectContexts(scatteredFixture);
      expect(violations).toHaveLength(5);
    });

    it("U23-a & U23-b: major-aspects contains all 5 dynamic labels from ASPECT_TYPE_LABELS paired with exact degrees in context", async () => {
      const result = await knowledgeContentService.getArticle("major-aspects");
      expect(result.status).toBe("found");

      if (result.status === "found") {
        const markdown = result.article.markdown;

        // U23-a: Every dynamic label from ASPECT_TYPE_LABELS is present
        for (const meta of Object.values(ASPECT_TYPE_LABELS)) {
          expect(
            markdown,
            `major-aspects must include canonical label "${meta.labelVi}"`,
          ).toContain(meta.labelVi);
        }

        // U23-b: Every canonical label is paired with its exact degree in context
        expect(findMissingMajorAspectContexts(markdown)).toEqual([]);
      }
    });

    it("U23-c: what-are-astrological-aspects and orbs-and-applying-separating use canonical labels consistently with 0 legacy leaks", async () => {
      const introResult = await knowledgeContentService.getArticle(
        "what-are-astrological-aspects",
      );
      expect(introResult.status).toBe("found");

      if (introResult.status === "found") {
        // Intro article lists all 5 supported canonical aspect labels on AstroViet
        for (const meta of Object.values(ASPECT_TYPE_LABELS)) {
          expect(introResult.article.markdown).toContain(meta.labelVi);
        }
        expect(
          findLegacyAspectLabelViolations(introResult.article.markdown, {
            allowFirstIntroAlias: true,
          }),
        ).toEqual([]);
      }

      const orbResult = await knowledgeContentService.getArticle(
        "orbs-and-applying-separating",
      );
      expect(orbResult.status).toBe("found");

      if (orbResult.status === "found") {
        const canonicalLabels = Object.values(ASPECT_TYPE_LABELS).map(
          (m) => m.labelVi,
        );
        const mentionedCanonicalCount = canonicalLabels.filter((label) =>
          orbResult.article.markdown.includes(label),
        ).length;
        expect(mentionedCanonicalCount).toBeGreaterThanOrEqual(3);
        expect(
          findLegacyAspectLabelViolations(orbResult.article.markdown, {
            allowFirstIntroAlias: true,
          }),
        ).toEqual([]);
      }
    });
  });

  describe("Canonical Planet, Node & Angle Terminology Guard (labels.ts parity)", () => {
    it("allows canonical Vietnamese names with English glosses in parentheses and rejects Vedic nodes, bare English names, and (AC)/(DC)", () => {
      const validFixture = [
        "## Các hành tinh và điểm góc",
        "Sao Thiên Vương (Uranus), Sao Hải Vương (Neptune), Sao Diêm Vương (Pluto), Nút Bắc (North Node) và Nút Nam (South Node).",
        "Cung Mọc (Ascendant — ASC), Thiên Đỉnh (Midheaven — MC), Cung Lặn (Descendant — DSC) và Thiên Để (Imum Coeli — IC).",
      ].join("\n");
      expect(findPlanetAndAngleTerminologyViolations(validFixture)).toEqual([]);

      const brokenFixture = [
        "## Lệch thuật ngữ",
        "La Hầu và Kế Đô, cùng Uranus và Mars tạo góc với Ascendant (AC) và Descendant (DC).",
      ].join("\n");
      const violations = findPlanetAndAngleTerminologyViolations(brokenFixture);
      expect(
        violations.some((v) => v.code === "NON_CANONICAL_NODE_LABEL"),
      ).toBe(true);
      expect(
        violations.some((v) => v.code === "NON_CANONICAL_ANGLE_ABBR"),
      ).toBe(true);
      expect(violations.some((v) => v.code === "BARE_ENGLISH_TERM")).toBe(true);
    });

    it("verifies all 15 production articles use canonical Vietnamese planet, node, and angle labels with zero bare English leaks", async () => {
      const articles = await knowledgeContentService.listArticles();
      expect(articles).toHaveLength(15);

      for (const meta of articles) {
        const result = await knowledgeContentService.getArticle(meta.slug);
        expect(result.status).toBe("found");

        if (result.status === "found") {
          const violations = findPlanetAndAngleTerminologyViolations(
            result.article.markdown,
          );
          expect(
            violations,
            `Article "${meta.slug}" has planet/node/angle terminology violations`,
          ).toEqual([]);
        }
      }
    });
  });
});
