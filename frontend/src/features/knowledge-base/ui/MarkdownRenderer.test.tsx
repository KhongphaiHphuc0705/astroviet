import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { renderWithProviders, screen } from "../../../test/render";

import { MarkdownRenderer } from "./MarkdownRenderer";

describe("MarkdownRenderer (KB-U10, KB-U11, KB-U12, KB-U16, KB-U17, KB-AC-12, KB-AC-20, KB-AC-22, KB-AC-23, KB-AC-25, KB-AC-34, KB-AC-35)", () => {
  const isKnownSlug = (slug: string) =>
    ["what-is-astrology", "sun-in-astrology"].includes(slug);

  describe("KB-U10 & KB-AC-12: Raw HTML and script sanitization", () => {
    it("should strip raw <script> tags and prevent script execution", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const maliciousMd = `<script>alert("XSS");</script>\n\nVăn bản bình thường.`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={maliciousMd} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("script")).toBeNull();
      expect(alertSpy).not.toHaveBeenCalled();
      expect(screen.getByText("Văn bản bình thường.")).toBeInTheDocument();
      alertSpy.mockRestore();
    });

    it("should strip raw <img onerror> tags and handler attributes", () => {
      const maliciousMd = `<img src="x" onerror="alert(1)">\n\nNội dung an toàn.`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={maliciousMd} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("img")).toBeNull();
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          expect(attr.name.toLowerCase().startsWith("on")).toBe(false);
        });
      });
      expect(screen.getByText("Nội dung an toàn.")).toBeInTheDocument();
    });

    it("should strip generic raw HTML elements like <iframe>, <div>, <style>", () => {
      const rawHtmlMd = `<iframe src="https://evil.com"></iframe>\n<div class="custom">Khối thẻ div</div>\n<style>body { color: red; }</style>\n\nVăn bản markdown.`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={rawHtmlMd} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("iframe")).toBeNull();
      expect(container.querySelector("style")).toBeNull();
      expect(screen.getByText("Văn bản markdown.")).toBeInTheDocument();
    });
  });

  describe("KB-U11, KB-AC-22, KB-AC-23: Link classification and security", () => {
    it("should render plain text fallback for hostile javascript: schemes", () => {
      const md = `[Nhấn vào đây](javascript:alert(1))`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("a")).toBeNull();
      const fallback = container.querySelector(
        'span[data-kb-fallback="link:unsupported-scheme"]',
      );
      expect(fallback).toBeInTheDocument();
      expect(fallback?.textContent).toBe("Nhấn vào đây");
    });

    it("should render plain text fallback for protocol-relative links", () => {
      const md = `[Liên kết xấu](//evil.com/phishing)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("a")).toBeNull();
      const fallback = container.querySelector(
        'span[data-kb-fallback="link:protocol-relative"]',
      );
      expect(fallback).toBeInTheDocument();
      expect(fallback?.textContent).toBe("Liên kết xấu");
    });

    it("should render plain text fallback for insecure http links", () => {
      const md = `[Trang không bảo mật](http://insecure.com)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("a")).toBeNull();
      const fallback = container.querySelector(
        'span[data-kb-fallback="link:unsupported-scheme"]',
      );
      expect(fallback).toBeInTheDocument();
    });

    it("should render secure <a> with target blank and noopener for valid https external links", () => {
      const md = `[AstroViet Trang chủ](https://astroviet.com)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const anchor = container.querySelector("a");
      expect(anchor).toBeInTheDocument();
      expect(anchor?.getAttribute("href")).toBe("https://astroviet.com/");
      expect(anchor?.getAttribute("target")).toBe("_blank");
      expect(anchor?.getAttribute("rel")).toBe("noopener noreferrer");
      expect(anchor?.textContent).toBe("AstroViet Trang chủ");
    });

    it("should render internal SPA link with <Link> for valid known slug and navigate without reload", async () => {
      const user = userEvent.setup();
      let currentLocation = "";

      function LocationObserver() {
        const location = useLocation();
        currentLocation = location.pathname;
        return <div data-testid="location">{location.pathname}</div>;
      }

      const md = `[Đọc bài chiêm tinh học](/knowledge/what-is-astrology)`;

      const { container } = render(
        <MemoryRouter initialEntries={["/knowledge"]}>
          <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />
          <LocationObserver />
        </MemoryRouter>,
      );

      const anchor = container.querySelector("a");
      expect(anchor).toBeInTheDocument();
      expect(anchor?.getAttribute("href")).toBe("/knowledge/what-is-astrology");
      expect(anchor?.getAttribute("target")).toBeNull();
      expect(anchor?.getAttribute("rel")).toBeNull();
      expect(currentLocation).toBe("/knowledge");

      if (anchor) {
        await user.click(anchor);
      }

      expect(currentLocation).toBe("/knowledge/what-is-astrology");
    });

    it("should render internal SPA link for /knowledge list root", () => {
      const md = `[Về trang kiến thức](/knowledge)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const anchor = container.querySelector("a");
      expect(anchor).toBeInTheDocument();
      expect(anchor?.getAttribute("href")).toBe("/knowledge");
    });

    it("locks WCAG AA high-contrast link color class (text-accent-secondary, not text-accent-primary) across internal and external links (F6.6.6)", () => {
      const md = [
        "[Bài nội bộ](/knowledge/what-is-astrology)",
        "[Danh sách](/knowledge)",
        "[Ngoài trang](https://astroviet.vn)",
      ].join(" · ");

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const anchors = Array.from(container.querySelectorAll("a"));
      expect(anchors).toHaveLength(3);
      for (const anchor of anchors) {
        expect(anchor.className).toContain("text-accent-secondary");
        expect(anchor.className).not.toContain("text-accent-primary");
      }
    });

    it("should render fallback text for internal link with unknown slug", () => {
      const md = `[Bài chưa xuất bản](/knowledge/unpublished-slug)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("a")).toBeNull();
      const fallback = container.querySelector(
        'span[data-kb-fallback="link:broken-internal"]',
      );
      expect(fallback).toBeInTheDocument();
      expect(fallback?.textContent).toBe("Bài chưa xuất bản");
    });
  });

  describe("KB-U12, KB-U17, KB-AC-25: Image classification, alt and lazy loading", () => {
    it("should render valid local image with loading='lazy' and decoding='async'", () => {
      const md = `![Biểu đồ sao mẫu](/knowledge/images/sample.png)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img?.getAttribute("src")).toBe("/knowledge/images/sample.png");
      expect(img?.getAttribute("alt")).toBe("Biểu đồ sao mẫu");
      expect(img?.getAttribute("loading")).toBe("lazy");
      expect(img?.getAttribute("decoding")).toBe("async");
    });

    it("should reject remote image and render hidden fallback marker", () => {
      const md = `![Ảnh từ xa](https://cdn.example.com/bad.png)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("img")).toBeNull();
      const fallback = container.querySelector(
        'span[data-kb-fallback="image:unsupported-image-source"]',
      );
      expect(fallback).toBeInTheDocument();
      expect(fallback?.hasAttribute("hidden")).toBe(true);
    });

    it("should reject image with missing or invalid alt text", () => {
      const md = `![](/knowledge/images/sample.png)\n\n![sample.png](/knowledge/images/sample.png)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("img")).toBeNull();
      const fallbacks = container.querySelectorAll(
        'span[data-kb-fallback="image:invalid-alt"]',
      );
      expect(fallbacks).toHaveLength(2);
    });
  });

  describe("KB-U16, KB-AC-20, KB-AC-35: Heading normalization and hierarchy", () => {
    it("should normalize H1 to H2 with marker and prevent H1 in output", () => {
      const md = `# Tiêu đề chính\n\nNội dung.`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("h1")).toBeNull();
      const h2 = container.querySelector("h2");
      expect(h2).toBeInTheDocument();
      expect(h2?.getAttribute("data-heading-normalized-from")).toBe("1");
      expect(h2?.textContent).toBe("Tiêu đề chính");
    });

    it("should preserve H2, H3, H4 without normalization marker", () => {
      const md = `## Cấp 2\n\n### Cấp 3\n\n#### Cấp 4`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const h2 = container.querySelector("h2");
      const h3 = container.querySelector("h3");
      const h4 = container.querySelector("h4");

      expect(h2?.getAttribute("data-heading-normalized-from")).toBeNull();
      expect(h3?.getAttribute("data-heading-normalized-from")).toBeNull();
      expect(h4?.getAttribute("data-heading-normalized-from")).toBeNull();
    });

    it("should normalize H5 and H6 to H4 with normalization marker", () => {
      const md = `##### Cấp 5\n\n###### Cấp 6`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(container.querySelector("h5")).toBeNull();
      expect(container.querySelector("h6")).toBeNull();

      const h4List = container.querySelectorAll("h4");
      expect(h4List).toHaveLength(2);
      expect(h4List[0]?.getAttribute("data-heading-normalized-from")).toBe("5");
      expect(h4List[1]?.getAttribute("data-heading-normalized-from")).toBe("6");
    });
  });

  describe("Code formatting (D-F6.2-06)", () => {
    it("should render inline code with font-data and surface-raised background", () => {
      const md = "Sử dụng biến `const x = 1;` trong bài.";

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const code = container.querySelector("code");
      expect(code).toBeInTheDocument();
      expect(code?.textContent).toBe("const x = 1;");
      expect(code?.className).toContain("font-data");
      expect(code?.className).toContain("bg-surface-raised");
    });

    it("should render code blocks within pre without language highlight styling or language-* class", () => {
      const md = "```ts\nconst value = 42;\n```";

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const pre = container.querySelector("pre");
      expect(pre).toBeInTheDocument();
      const code = pre?.querySelector("code");
      expect(code).toBeInTheDocument();
      expect(code?.textContent?.trim()).toBe("const value = 42;");
      expect(code?.className).not.toMatch(/language-/);
    });
  });

  describe("DOM Integrity & Optimization", () => {
    it("should not leak hast node attribute to DOM elements", () => {
      const md = [
        "## Tiêu đề cấp 2",
        "### Tiêu đề cấp 3",
        "Đoạn văn có mã `inline` và liên kết.",
        "- Danh sách không thứ tự",
        "1. Danh sách có thứ tự",
        "> Khối trích dẫn",
        "---",
        "```ts",
        "const test = true;",
        "```",
        "[Liên kết](/knowledge/what-is-astrology)",
        "![Biểu đồ](/knowledge/images/sample.png)",
      ].join("\n\n");

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      const elementsWithNodeAttr = container.querySelectorAll("[node]");
      expect(elementsWithNodeAttr).toHaveLength(0);
    });

    it("should not remount DOM elements on parent rerender with same props", () => {
      const md = `## Tiêu đề ổn định\n\nĐoạn văn không đổi.\n\n![Ảnh](/knowledge/images/sample.png)`;

      const { container, rerender } = renderWithProviders(
        <MarkdownRenderer
          markdown={md}
          isKnownSlug={isKnownSlug}
          className="class-a"
        />,
      );

      const initialH2 = container.querySelector("h2");
      const initialP = container.querySelector("p");
      const initialImg = container.querySelector("img");

      expect(initialH2).toBeInTheDocument();
      expect(initialP).toBeInTheDocument();
      expect(initialImg).toBeInTheDocument();

      rerender(
        <MarkdownRenderer
          markdown={md}
          isKnownSlug={isKnownSlug}
          className="class-b"
        />,
      );

      const rerenderedH2 = container.querySelector("h2");
      const rerenderedP = container.querySelector("p");
      const rerenderedImg = container.querySelector("img");

      expect(rerenderedH2).toBe(initialH2);
      expect(rerenderedP).toBe(initialP);
      expect(rerenderedImg).toBe(initialImg);
    });
  });

  describe("Accessibility (axe)", () => {
    it("should pass axe accessibility checks on typical article markdown", async () => {
      const md = `## Khái niệm cơ bản\n\nĐây là đoạn văn giới thiệu chiêm tinh học.\n\n- Điểm 1\n- Điểm 2\n\n[Đọc thêm](https://astroviet.com)\n\n![Biểu đồ sao](/knowledge/images/chart.png)`;

      const { container } = renderWithProviders(
        <MarkdownRenderer markdown={md} isKnownSlug={isKnownSlug} />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
