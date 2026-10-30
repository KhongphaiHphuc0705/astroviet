import { screen, fireEvent } from "@testing-library/react";
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
});
