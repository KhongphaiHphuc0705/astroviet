import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { MarkdownRenderer } from "../../features/knowledge-base/ui/MarkdownRenderer";

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
