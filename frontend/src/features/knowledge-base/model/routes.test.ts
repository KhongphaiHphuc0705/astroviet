import { describe, it, expect } from "vitest";

import { KNOWLEDGE_LIST_PATH, knowledgeArticlePath } from "./routes";

describe("Knowledge Base Routes (KB-U31a, D-F6.3-04)", () => {
  it("exports correct KNOWLEDGE_LIST_PATH constant", () => {
    expect(KNOWLEDGE_LIST_PATH).toBe("/knowledge");
  });

  it("builds canonical article path from slug", () => {
    expect(knowledgeArticlePath("what-is-astrology")).toBe(
      "/knowledge/what-is-astrology",
    );
    expect(knowledgeArticlePath("sun-in-astrology")).toBe(
      "/knowledge/sun-in-astrology",
    );
    expect(knowledgeArticlePath("house-1")).toBe("/knowledge/house-1");
  });
});
