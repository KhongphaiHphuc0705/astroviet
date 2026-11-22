import { render, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { usePageMeta, type PageMeta } from "./usePageMeta";

function clearManagedHeadTags() {
  document.head
    .querySelectorAll(
      'meta[name="description"], meta[name="robots"], link[rel="canonical"], meta[property^="og:"]',
    )
    .forEach((el) => el.remove());
}

describe("usePageMeta (KB-U45, KB-U46, KB-U47, KB-U48, D-F6.4-02)", () => {
  beforeEach(() => {
    document.title = "AstroViet";
    clearManagedHeadTags();
  });

  afterEach(() => {
    document.title = "AstroViet";
    clearManagedHeadTags();
  });

  it("should upsert title, description, canonical, robots, and OG tags without duplicating or emitting og:image (KB-U45)", () => {
    const meta: PageMeta = {
      title: "Chiêm tinh học là gì? — AstroViet",
      description: "Tổng quan nền tảng.",
      canonicalUrl: "https://astroviet.com/knowledge/what-is-astrology",
      openGraph: {
        type: "article",
        title: "Chiêm tinh học là gì?",
        description: "Tổng quan nền tảng.",
        url: "https://astroviet.com/knowledge/what-is-astrology",
      },
    };

    const { rerender } = renderHook(({ value }) => usePageMeta(value), {
      initialProps: { value: meta as PageMeta | null },
    });

    expect(document.title).toBe("Chiêm tinh học là gì? — AstroViet");
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe("Tổng quan nền tảng.");
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://astroviet.com/knowledge/what-is-astrology");
    expect(
      document.head
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
    ).toBe("article");
    expect(
      document.head
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content"),
    ).toBe("Chiêm tinh học là gì?");
    expect(
      document.head
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content"),
    ).toBe("Tổng quan nền tảng.");
    expect(
      document.head
        .querySelector('meta[property="og:url"]')
        ?.getAttribute("content"),
    ).toBe("https://astroviet.com/knowledge/what-is-astrology");
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();

    // Re-rendering with a new object having identical fields does not duplicate tags
    rerender({ value: { ...meta, openGraph: { ...meta.openGraph! } } });
    expect(
      document.head.querySelectorAll('meta[name="description"]'),
    ).toHaveLength(1);
    expect(
      document.head.querySelectorAll('link[rel="canonical"]'),
    ).toHaveLength(1);
    expect(
      document.head.querySelectorAll('meta[property="og:type"]'),
    ).toHaveLength(1);
  });

  it("should be a no-op when meta is null (KB-U45)", () => {
    renderHook(() => usePageMeta(null));

    expect(document.title).toBe("AstroViet");
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("should restore previous title and pre-existing tag values while removing newly created tags on unmount (KB-U46)", () => {
    const existingDescription = document.createElement("meta");
    existingDescription.setAttribute("name", "description");
    existingDescription.setAttribute("content", "Initial description");
    document.head.appendChild(existingDescription);

    const { unmount } = renderHook(() =>
      usePageMeta({
        title: "Bài viết — AstroViet",
        description: "Mô tả bài viết",
        canonicalUrl: "https://astroviet.com/knowledge/sample",
        robots: "noindex",
      }),
    );

    expect(document.title).toBe("Bài viết — AstroViet");
    expect(existingDescription.getAttribute("content")).toBe("Mô tả bài viết");
    expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull();
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute("content"),
    ).toBe("noindex");

    unmount();

    expect(document.title).toBe("AstroViet");
    expect(existingDescription.getAttribute("content")).toBe(
      "Initial description",
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("should update metadata cleanly on A -> B -> NotFound switches and remove omitted tags (KB-U47)", () => {
    const articleA: PageMeta = {
      title: "Article A — AstroViet",
      description: "Desc A",
      canonicalUrl: "https://astroviet.com/knowledge/a",
      openGraph: {
        type: "article",
        title: "Article A",
        description: "Desc A",
        url: "https://astroviet.com/knowledge/a",
      },
    };
    const articleB: PageMeta = {
      title: "Article B — AstroViet",
      description: "Desc B",
      canonicalUrl: "https://astroviet.com/knowledge/b",
      openGraph: {
        type: "article",
        title: "Article B",
        description: "Desc B",
        url: "https://astroviet.com/knowledge/b",
      },
    };
    const notFound: PageMeta = {
      title: "Không tìm thấy bài viết — AstroViet",
      description: "Bài viết bạn tìm không tồn tại hoặc đã được di chuyển.",
      robots: "noindex",
      openGraph: {
        type: "website",
        title: "Không tìm thấy bài viết — AstroViet",
        description: "Bài viết bạn tìm không tồn tại hoặc đã được di chuyển.",
      },
    };

    const { rerender } = renderHook(({ value }) => usePageMeta(value), {
      initialProps: { value: articleA },
    });

    expect(document.title).toBe("Article A — AstroViet");
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://astroviet.com/knowledge/a");

    // Switch A -> B
    rerender({ value: articleB });
    expect(document.title).toBe("Article B — AstroViet");
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://astroviet.com/knowledge/b");
    expect(
      document.head.querySelectorAll('link[rel="canonical"]'),
    ).toHaveLength(1);

    // Switch B -> NotFound (canonical & og:url must be removed; robots="noindex" added)
    rerender({ value: notFound });
    expect(document.title).toBe("Không tìm thấy bài viết — AstroViet");
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute("content"),
    ).toBe("noindex");
  });

  it("should not leak KB metadata when navigating Listing -> Article -> Listing -> Home via Router (KB-U48)", async () => {
    const user = userEvent.setup();

    function ListingStub() {
      usePageMeta({
        title: "Kiến thức chiêm tinh — AstroViet",
        description: "List desc",
        canonicalUrl: "https://astroviet.com/knowledge",
        openGraph: {
          type: "website",
          title: "Kiến thức chiêm tinh — AstroViet",
          description: "List desc",
          url: "https://astroviet.com/knowledge",
        },
      });
      return (
        <div>
          <Link to="/knowledge/a">Open A</Link>
          <Link to="/">Go Home</Link>
        </div>
      );
    }

    function ArticleStub() {
      usePageMeta({
        title: "Article A — AstroViet",
        description: "Article A desc",
        canonicalUrl: "https://astroviet.com/knowledge/a",
        openGraph: {
          type: "article",
          title: "Article A",
          description: "Article A desc",
          url: "https://astroviet.com/knowledge/a",
        },
      });
      return <Link to="/knowledge">Back to Listing</Link>;
    }

    function HomeStub() {
      return <h1>Home</h1>;
    }

    const { getByRole } = render(
      <MemoryRouter initialEntries={["/knowledge"]}>
        <Routes>
          <Route path="/" element={<HomeStub />} />
          <Route path="/knowledge" element={<ListingStub />} />
          <Route path="/knowledge/a" element={<ArticleStub />} />
        </Routes>
      </MemoryRouter>,
    );

    // 1. Listing
    expect(document.title).toBe("Kiến thức chiêm tinh — AstroViet");
    expect(
      document.head
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
    ).toBe("website");

    // 2. Listing -> Article A
    await user.click(getByRole("link", { name: "Open A" }));
    expect(document.title).toBe("Article A — AstroViet");
    expect(
      document.head
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
    ).toBe("article");
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://astroviet.com/knowledge/a");

    // 3. Article A -> Listing
    await user.click(getByRole("link", { name: "Back to Listing" }));
    expect(document.title).toBe("Kiến thức chiêm tinh — AstroViet");
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://astroviet.com/knowledge");

    // 4. Listing -> Home (non-KB route): all KB tags cleaned up & title restored
    await user.click(getByRole("link", { name: "Go Home" }));
    expect(document.title).toBe("AstroViet");
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:type"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
  });
});
