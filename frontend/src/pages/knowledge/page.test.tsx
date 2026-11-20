import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { renderWithProviders } from "@test/render";

import KnowledgePage from "./page";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("KnowledgePage (KB-U36, KB-A01, D-F6.3-01, D-F6.3-05)", () => {
  it("renders page title h1, description, category filter, status counter, and article cards (KB-U36)", () => {
    const { container } = renderWithProviders(<KnowledgePage />);

    // Single H1 with exact approved copy
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Kiến thức chiêm tinh");

    // Intro description
    expect(
      screen.getByText(
        "Tìm hiểu các khái niệm nền tảng của chiêm tinh phương Tây: hành tinh, cung hoàng đạo, nhà và góc chiếu.",
      ),
    ).toBeInTheDocument();

    // Category filter group
    expect(
      screen.getByRole("group", { name: "Lọc theo chủ đề" }),
    ).toBeInTheDocument();

    // Live status counter
    expect(screen.getByRole("status")).toHaveTextContent(
      /Hiển thị \d+ bài viết/,
    );

    // At least one article rendered from production manifest
    const articleElements = container.querySelectorAll("article");
    expect(articleElements.length).toBeGreaterThanOrEqual(1);
  });

  it("enforces listing boundaries: no markdown libs, pagination, or search inputs (KB-U36)", () => {
    const pageSource = readFileSync(join(__dirname, "page.tsx"), "utf-8");

    // Must not import or reference Markdown renderer or markdown libraries
    expect(pageSource).not.toMatch(/MarkdownRenderer/);
    expect(pageSource).not.toMatch(/react-markdown/);
    expect(pageSource).not.toMatch(/dangerouslySetInnerHTML/);
    expect(pageSource).not.toMatch(/import\.meta\.glob/);

    // Must not contain pagination or search elements (out of scope for F6.3)
    expect(pageSource).not.toMatch(/Pagination/i);
    expect(pageSource).not.toMatch(/type=["']search["']/);
  });

  it("has zero accessibility violations (KB-A01, axe)", async () => {
    const { container } = renderWithProviders(<KnowledgePage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
