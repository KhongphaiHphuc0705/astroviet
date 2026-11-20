/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_ROOT = resolve(__dirname, "..");

function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results.push(...getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Knowledge Base Architectural Boundaries & Regex Gates", () => {
  const allKbFiles = getAllFiles(KB_ROOT);
  const allCodeFiles = allKbFiles.filter(
    (file) => file.endsWith(".ts") || file.endsWith(".tsx"),
  );
  const productionModelFiles = allCodeFiles.filter((file) => {
    const rel = relative(KB_ROOT, file).replace(/\\/g, "/");
    return rel.startsWith("model/") && !rel.endsWith(".test.ts");
  });

  describe("KB-U12b: Forbidden Markdown Plugins & Raw HTML Injection Gate", () => {
    it("should not contain dangerouslySetInnerHTML, rehype-raw, remark-gfm, rehype-sanitize, or gray-matter anywhere in knowledge-base", () => {
      const forbiddenPattern =
        /dangerouslySetInnerHTML|rehype-raw|remark-gfm|rehype-sanitize|gray-matter/;

      for (const file of allKbFiles) {
        // Skip this test file itself from the literal pattern match
        if (file.endsWith("boundaries.test.ts")) {
          continue;
        }

        const content = readFileSync(file, "utf-8");
        const match = forbiddenPattern.exec(content);
        expect(
          match,
          `File ${relative(KB_ROOT, file)} contains forbidden token: ${match?.[0]}`,
        ).toBeNull();
      }
    });
  });

  describe("KB-U26: import.meta.glob Isolation Gate", () => {
    it("should restrict import.meta.glob solely to contentFiles.ts and test files", () => {
      const globPattern = /import\.meta\.glob/;

      for (const file of allCodeFiles) {
        const rel = relative(KB_ROOT, file).replace(/\\/g, "/");
        const isAllowed =
          rel === "model/contentFiles.ts" ||
          rel.endsWith(".test.ts") ||
          rel.endsWith(".test.tsx");

        const content = readFileSync(file, "utf-8");
        const hasGlob = globPattern.test(content);

        if (!isAllowed) {
          expect(
            hasGlob,
            `File ${rel} must not use import.meta.glob; only model/contentFiles.ts is permitted`,
          ).toBe(false);
        }
      }
    });
  });

  describe("KB-U30: Architectural Dependency Direction Gates (Section 5.1)", () => {
    it("should verify production model/*.ts files do not import react, react-dom, react-router-dom, or react-markdown", () => {
      const forbiddenImports =
        /from\s+["'](react|react-dom|react-router-dom|react-markdown)(?:\/.*)?["']/;

      expect(productionModelFiles.length).toBeGreaterThan(0);

      for (const file of productionModelFiles) {
        const content = readFileSync(file, "utf-8");
        const match = forbiddenImports.exec(content);
        expect(
          match,
          `Production model file ${relative(KB_ROOT, file)} must not import UI/React packages: ${match?.[0]}`,
        ).toBeNull();
      }
    });

    it("should verify production model/*.ts files do not reference window, document, or import.meta.env", () => {
      const forbiddenGlobals = /\b(window|document)\b|import\.meta\.env/;

      expect(productionModelFiles.length).toBeGreaterThan(0);

      for (const file of productionModelFiles) {
        const content = readFileSync(file, "utf-8");
        const match = forbiddenGlobals.exec(content);
        expect(
          match,
          `Production model file ${relative(KB_ROOT, file)} must not reference browser globals or env: ${match?.[0]}`,
        ).toBeNull();
      }
    });

    it("should verify MarkdownRenderer.tsx does not import contentFiles, knowledgeContentService, or manifest", () => {
      const rendererFile = join(KB_ROOT, "ui", "MarkdownRenderer.tsx");
      const content = readFileSync(rendererFile, "utf-8");

      const forbiddenImports =
        /from\s+["'].*?(contentFiles|knowledgeContentService|manifest)["']/;
      const match = forbiddenImports.exec(content);

      expect(
        match,
        `MarkdownRenderer.tsx must not import content files, service, or manifest: ${match?.[0]}`,
      ).toBeNull();
    });

    it("should verify knowledgeContentService.ts does not import MarkdownRenderer, react-markdown, or seo", () => {
      const serviceFile = join(KB_ROOT, "model", "knowledgeContentService.ts");
      const content = readFileSync(serviceFile, "utf-8");

      const forbiddenImports =
        /from\s+["'].*?(MarkdownRenderer|react-markdown|seo)["']/;
      const match = forbiddenImports.exec(content);

      expect(
        match,
        `knowledgeContentService.ts must not import MarkdownRenderer or seo: ${match?.[0]}`,
      ).toBeNull();
    });

    it("should verify index.ts does not use export * and only uses explicit named exports", () => {
      const indexFile = join(KB_ROOT, "index.ts");
      const content = readFileSync(indexFile, "utf-8");

      expect(content).not.toMatch(/export\s+\*\s+from/);
      expect(content).toMatch(/export\s+\{/);
    });

    it("should verify index.ts does not export MarkdownRenderer to protect service consumers from bundling react-markdown", () => {
      const indexFile = join(KB_ROOT, "index.ts");
      const content = readFileSync(indexFile, "utf-8");

      expect(content).not.toMatch(/MarkdownRenderer/);
      expect(content).not.toMatch(/from\s+["']\.\/ui\/MarkdownRenderer/);
    });
  });
});
