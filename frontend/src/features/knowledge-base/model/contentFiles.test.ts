import { describe, it, expect } from "vitest";

import { createContentRegistry, contentRegistry } from "./contentFiles";
import { checkContentParity } from "./contentIntegrity";
import { KNOWLEDGE_MANIFEST } from "./manifest";

describe("Content Files & Registry (KB-U27, KB-AC-33)", () => {
  describe("createContentRegistry with DI mock glob", () => {
    it("should normalize and sort glob keys", () => {
      const mockGlob = {
        "../content/planets/sun.md": () => Promise.resolve("# Sun"),
        "../content/fundamentals/intro.md": () => Promise.resolve("# Intro"),
      };

      const registry = createContentRegistry(mockGlob);
      expect(registry.listKeys()).toEqual([
        "content/fundamentals/intro.md",
        "content/planets/sun.md",
      ]);
    });

    it("should load content and normalize CRLF to LF", async () => {
      const mockGlob = {
        "../content/fundamentals/intro.md": () =>
          Promise.resolve("Line 1\r\nLine 2\r\nLine 3"),
      };

      const registry = createContentRegistry(mockGlob);
      const result = await registry.load("fundamentals", "intro");

      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.markdown).toBe("Line 1\nLine 2\nLine 3");
      }
    });

    it("should return missing status when file does not exist in registry", async () => {
      const registry = createContentRegistry({});
      const result = await registry.load("fundamentals", "non-existent");

      expect(result.status).toBe("missing");
    });

    it("should return error status when loader rejects", async () => {
      const loadError = new Error("Network / disk error");
      const mockGlob = {
        "../content/fundamentals/broken.md": () => Promise.reject(loadError),
      };

      const registry = createContentRegistry(mockGlob);
      const result = await registry.load("fundamentals", "broken");

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.cause).toBe(loadError);
      }
    });
  });

  describe("Real wiring with actual import.meta.glob (KB-U27)", () => {
    it("should discover the real sample article what-is-astrology", () => {
      const keys = contentRegistry.listKeys();
      expect(keys).toContain("content/fundamentals/what-is-astrology.md");
    });

    it("should satisfy two-way content parity against production KNOWLEDGE_MANIFEST", () => {
      const keys = contentRegistry.listKeys();
      const parity = checkContentParity(KNOWLEDGE_MANIFEST, keys);

      expect(parity.missingFiles).toHaveLength(0);
      expect(parity.orphanFiles).toHaveLength(0);
      expect(parity.malformedKeys).toHaveLength(0);
    });

    it("should load the real sample article markdown cleanly", async () => {
      const result = await contentRegistry.load(
        "fundamentals",
        "what-is-astrology",
      );

      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.markdown).toContain(
          "Khái niệm nền tảng về chiêm tinh học",
        );
        expect(result.markdown).not.toContain("\r\n");
      }
    });
  });
});
