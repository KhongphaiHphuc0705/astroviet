import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { ArticleNotFound } from "./ArticleNotFound";

describe("ArticleNotFound (KB-U09, KB-U40, KB-A09, KB-AC-05)", () => {
  it("should render approved Vietnamese copy, single h1, and link back to /knowledge", () => {
    render(
      <MemoryRouter initialEntries={["/knowledge/khong-ton-tai"]}>
        <ArticleNotFound />
      </MemoryRouter>,
    );

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Không tìm thấy bài viết");

    expect(
      screen.getByText(
        "Bài viết bạn tìm không tồn tại hoặc đã được di chuyển.",
      ),
    ).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: "Tất cả bài viết" });
    expect(backLink).toHaveAttribute("href", "/knowledge");
    expect(backLink).toHaveTextContent("←Tất cả bài viết");
  });

  it("should navigate to /knowledge without reload when back-link is clicked", async () => {
    const user = userEvent.setup();
    let currentPath = "";

    function LocationObserver() {
      const location = useLocation();
      currentPath = location.pathname;
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/knowledge/khong-ton-tai"]}>
        <ArticleNotFound />
        <LocationObserver />
      </MemoryRouter>,
    );

    expect(currentPath).toBe("/knowledge/khong-ton-tai");
    await user.click(screen.getByRole("link", { name: "Tất cả bài viết" }));
    expect(currentPath).toBe("/knowledge");
  });

  it("should have zero accessibility violations (KB-A09, axe)", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/knowledge/khong-ton-tai"]}>
        <ArticleNotFound />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
