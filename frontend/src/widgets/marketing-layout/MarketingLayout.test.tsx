import { screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { useAuthStore } from "@shared/stores/authStore";
import { useUiStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "@test/render";

import { MarketingLayout } from "./index";

describe("MarketingLayout", () => {
  beforeEach(() => {
    useUiStore.setState({ mobileDrawerOpen: false });
    useAuthStore.setState({
      status: "unauthenticated",
      accessToken: null,
      user: null,
    });
  });

  it("renders required landmarks (header, nav, main, footer)", () => {
    renderWithProviders(<MarketingLayout>Test Content</MarketingLayout>);

    // Check navigation (desktop and mobile)
    const navs = screen.getAllByRole("navigation", { hidden: true });
    expect(navs.length).toBeGreaterThan(0);
    expect(navs[0]?.getAttribute("aria-label")).toContain("Điều hướng chính");

    // Check main content
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main.id).toBe("main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toHaveTextContent("Test Content");

    // Check SkipLink (SK1 / SK3)
    const skipLink = screen.getByRole("link", {
      name: "Chuyển đến nội dung chính",
    });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Check footer
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  it("can toggle mobile drawer", () => {
    renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

    const menuBtn = screen.getByLabelText("Menu");
    fireEvent.click(menuBtn);

    const closeBtn = screen.getByLabelText("Đóng menu");
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
  });

  it("renders login and register navigation when unauthenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

    const loginLinks = screen.getAllByRole("link", { name: "Đăng nhập" });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(loginLinks[0]).toHaveAttribute("href", "/login");

    const registerLinks = screen.getAllByRole("link", { name: "Đăng ký" });
    expect(registerLinks.length).toBeGreaterThanOrEqual(1);
    expect(registerLinks[0]).toHaveAttribute("href", "/register");
  });

  it("renders enter app navigation when authenticated", () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "mock-token",
      user: {
        id: "1",
        email: "test@example.com",
        displayName: "Tester",
        role: "user",
        createdAt: "2026-01-01",
      },
    });

    renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

    const appLinks = screen.getAllByRole("link", {
      name: /vào (ứng dụng|app)/i,
    });
    expect(appLinks.length).toBeGreaterThanOrEqual(1);
    expect(appLinks[0]).toHaveAttribute("href", "/app");
  });

  it("does not render auth buttons when status is resolving (prevents flash)", () => {
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });

    renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

    expect(
      screen.queryByRole("link", { name: "Đăng nhập" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Đăng ký" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /vào (ứng dụng|app)/i }),
    ).not.toBeInTheDocument();
  });

  describe("Knowledge Base Navigation (KB-AC-06, D-F6-N1, D-F6.5-10)", () => {
    it("KB-U-nav-1: renders exactly one 'Kiến thức' link to /knowledge in desktop nav", () => {
      renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

      const desktopNav = screen.getByRole("navigation", {
        name: "Điều hướng chính",
        hidden: true,
      });
      const knowledgeLinks = within(desktopNav).getAllByRole("link", {
        name: "Kiến thức",
        hidden: true,
      });
      expect(knowledgeLinks).toHaveLength(1);
      expect(knowledgeLinks[0]).toHaveAttribute("href", "/knowledge");
    });

    it("KB-U-nav-2: renders exactly one 'Kiến thức' link in mobile drawer and closes drawer on click", () => {
      useUiStore.setState({ mobileDrawerOpen: true });
      renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

      const mobileNav = screen.getByRole("navigation", {
        name: "Điều hướng chính (Mobile)",
        hidden: true,
      });
      const knowledgeLinks = within(mobileNav).getAllByRole("link", {
        name: "Kiến thức",
        hidden: true,
      });
      expect(knowledgeLinks).toHaveLength(1);
      expect(knowledgeLinks[0]).toHaveAttribute("href", "/knowledge");

      fireEvent.click(knowledgeLinks[0]!);
      expect(useUiStore.getState().mobileDrawerOpen).toBe(false);
    });

    it("KB-U-nav-3: renders footer nav 'Chân trang' with exactly one 'Kiến thức' link and no heading inside", () => {
      renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

      const footer = screen.getByRole("contentinfo");
      const footerNav = within(footer).getByRole("navigation", {
        name: "Chân trang",
      });
      const knowledgeLinks = within(footerNav).getAllByRole("link", {
        name: "Kiến thức",
      });
      expect(knowledgeLinks).toHaveLength(1);
      expect(knowledgeLinks[0]).toHaveAttribute("href", "/knowledge");
      expect(within(footerNav).queryAllByRole("heading")).toHaveLength(0);
    });

    it("KB-U-nav-4: marks desktop and mobile NavLinks active on /knowledge and /knowledge/:slug, inactive on /", () => {
      const { unmount: unmountList } = renderWithProviders(
        <MarketingLayout>Listing</MarketingLayout>,
        { initialEntries: ["/knowledge"] },
      );
      const desktopAtList = within(
        screen.getByRole("navigation", {
          name: "Điều hướng chính",
          hidden: true,
        }),
      ).getByRole("link", { name: "Kiến thức", hidden: true });
      const mobileAtList = within(
        screen.getByRole("navigation", {
          name: "Điều hướng chính (Mobile)",
          hidden: true,
        }),
      ).getByRole("link", { name: "Kiến thức", hidden: true });
      expect(desktopAtList).toHaveAttribute("aria-current", "page");
      expect(mobileAtList).toHaveAttribute("aria-current", "page");
      unmountList();

      const { unmount: unmountDetail } = renderWithProviders(
        <MarketingLayout>Detail</MarketingLayout>,
        { initialEntries: ["/knowledge/what-is-astrology"] },
      );
      const desktopAtDetail = within(
        screen.getByRole("navigation", {
          name: "Điều hướng chính",
          hidden: true,
        }),
      ).getByRole("link", { name: "Kiến thức", hidden: true });
      const mobileAtDetail = within(
        screen.getByRole("navigation", {
          name: "Điều hướng chính (Mobile)",
          hidden: true,
        }),
      ).getByRole("link", { name: "Kiến thức", hidden: true });
      expect(desktopAtDetail).toHaveAttribute("aria-current", "page");
      expect(mobileAtDetail).toHaveAttribute("aria-current", "page");
      unmountDetail();

      renderWithProviders(<MarketingLayout>Home</MarketingLayout>, {
        initialEntries: ["/"],
      });
      const desktopAtHome = within(
        screen.getByRole("navigation", {
          name: "Điều hướng chính",
          hidden: true,
        }),
      ).getByRole("link", { name: "Kiến thức", hidden: true });
      const mobileAtHome = within(
        screen.getByRole("navigation", {
          name: "Điều hướng chính (Mobile)",
          hidden: true,
        }),
      ).getByRole("link", { name: "Kiến thức", hidden: true });
      expect(desktopAtHome).not.toHaveAttribute("aria-current");
      expect(mobileAtHome).not.toHaveAttribute("aria-current");
    });

    it("KB-U-nav-5: keeps 'Kiến thức' link present across authenticated, unauthenticated, and resolving states", () => {
      for (const authState of [
        "authenticated",
        "unauthenticated",
        "resolving",
      ] as const) {
        useAuthStore.setState({
          status: authState,
          accessToken: authState === "authenticated" ? "mock-token" : null,
          user:
            authState === "authenticated"
              ? {
                  id: "1",
                  email: "test@example.com",
                  displayName: "Tester",
                  role: "user",
                  createdAt: "2026-01-01",
                }
              : null,
        });

        const { unmount } = renderWithProviders(
          <MarketingLayout>Content</MarketingLayout>,
        );
        const allKnowledgeLinks = screen.getAllByRole("link", {
          name: "Kiến thức",
          hidden: true,
        });
        expect(allKnowledgeLinks).toHaveLength(3);
        unmount();
      }
    });

    it("KB-U-nav-6: exposes exactly 3 navigation landmarks with unique accessible names", () => {
      renderWithProviders(<MarketingLayout>Test</MarketingLayout>);

      const navs = screen.getAllByRole("navigation", { hidden: true });
      expect(navs).toHaveLength(3);

      const labels = navs.map((nav) => nav.getAttribute("aria-label"));
      expect(labels).toEqual([
        "Điều hướng chính",
        "Điều hướng chính (Mobile)",
        "Chân trang",
      ]);
      expect(new Set(labels).size).toBe(3);
    });
  });
});
