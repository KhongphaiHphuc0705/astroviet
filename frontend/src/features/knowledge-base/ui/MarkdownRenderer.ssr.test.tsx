import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MarkdownRenderer } from "./MarkdownRenderer";

describe("MarkdownRenderer SSR Safety (KB-U28)", () => {
  it("should render to string on server without window or browser globals", () => {
    const md = `## Giới thiệu server render\n\nĐoạn văn được render từ server.\n\n[Liên kết](https://astroviet.com)\n\n![Ảnh đại diện](/knowledge/images/sample.png)`;

    const html = renderToString(
      <StaticRouter location="/knowledge/what-is-astrology">
        <MarkdownRenderer
          markdown={md}
          isKnownSlug={(slug) => slug === "what-is-astrology"}
        />
      </StaticRouter>,
    );

    expect(html).toContain("Giới thiệu server render");
    expect(html).toContain("Đoạn văn được render từ server.");
    expect(html).toContain('href="https://astroviet.com/"');
    expect(html).toContain('src="/knowledge/images/sample.png"');
    expect(html).not.toContain("<script");
  });
});
