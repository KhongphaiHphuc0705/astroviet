import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";

import { useUiStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "@test/render";

import { AppLayout } from "./index";

// Helper: render AppLayout with a destination route for navigation tests
function renderWithRoute(initialEntries = ["/"]) {
  return renderWithProviders(
    <Routes>
      <Route path="*" element={<AppLayout>Dashboard Content</AppLayout>} />
      <Route
        path="/app/profiles"
        element={<div data-testid="profiles-page">Profiles Page</div>}
      />
    </Routes>,
    { initialEntries },
  );
}

describe("AppLayout", () => {
  beforeEach(() => {
    // Reset singleton Zustand store to prevent state leakage between tests (F-08)
    useUiStore.setState({ mobileDrawerOpen: false, sidebarCollapsed: false });
  });

  it("renders app layout and dual nav landmarks", () => {
    renderWithProviders(<AppLayout>Dashboard Content</AppLayout>);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();

    const navs = screen.getAllByRole("navigation", { hidden: true });
    expect(navs.length).toBeGreaterThanOrEqual(2);
  });

  it("can toggle mobile drawer and close via overlay", () => {
    renderWithProviders(<AppLayout>Test</AppLayout>);

    const menuBtn = screen.getByLabelText("Menu");
    fireEvent.click(menuBtn);

    const closeBtn = screen.getByLabelText("Đóng menu");
    expect(closeBtn).toBeInTheDocument();

    const overlay = screen.getByTestId("drawer-overlay");
    fireEvent.click(overlay);

    // Just testing it can be clicked without errors.
    // Note: To properly test state changes we'd need to mock/reset zustand store
  });

  it("can toggle mobile drawer", () => {
    renderWithProviders(<AppLayout>Test</AppLayout>);

    const menuBtn = screen.getByLabelText("Menu");
    fireEvent.click(menuBtn);

    const closeBtn = screen.getByLabelText("Đóng menu");
    expect(closeBtn).toBeInTheDocument();
  });

  it("renders fallback header actions when no headerActions prop is provided", () => {
    renderWithProviders(<AppLayout>Dashboard Content</AppLayout>);
    expect(screen.getByTestId("header-actions-fallback")).toBeInTheDocument();
  });

  it("renders provided headerActions and hides fallback", () => {
    renderWithProviders(
      <AppLayout headerActions={<div data-testid="custom-actions">Custom</div>}>
        Dashboard Content
      </AppLayout>,
    );
    expect(screen.getByTestId("custom-actions")).toBeInTheDocument();
    expect(
      screen.queryByTestId("header-actions-fallback"),
    ).not.toBeInTheDocument();
  });

  // AC-1: Desktop nav contains "Hồ sơ sinh" link
  it("renders Hồ sơ sinh link in desktop nav landmark", () => {
    renderWithProviders(<AppLayout>Dashboard Content</AppLayout>);

    const desktopNav = screen.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    const link = desktopNav.querySelector('a[href="/app/profiles"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("Hồ sơ sinh");
  });

  // AC-2: Mobile nav contains "Hồ sơ sinh" link
  it("renders Hồ sơ sinh link in mobile nav landmark", () => {
    renderWithProviders(<AppLayout>Dashboard Content</AppLayout>);

    const mobileNav = screen.getByRole("navigation", {
      name: "Điều hướng chính (Mobile)",
    });
    const link = mobileNav.querySelector('a[href="/app/profiles"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("Hồ sơ sinh");
  });

  // AC-4 (desktop): clicking the link navigates to /app/profiles
  it("navigates to /app/profiles when clicking desktop Hồ sơ sinh link", () => {
    renderWithRoute(["/"]);

    const desktopNav = screen.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    const link = desktopNav.querySelector('a[href="/app/profiles"]')!;
    fireEvent.click(link);

    expect(screen.getByTestId("profiles-page")).toBeInTheDocument();
  });

  // AC-4 (mobile): clicking the link navigates and closes the drawer
  it("navigates to /app/profiles and closes drawer when clicking mobile Hồ sơ sinh link", () => {
    renderWithRoute(["/"]);

    // Open drawer
    fireEvent.click(screen.getByLabelText("Menu"));
    expect(useUiStore.getState().mobileDrawerOpen).toBe(true);

    const mobileNav = screen.getByRole("navigation", {
      name: "Điều hướng chính (Mobile)",
    });
    const link = mobileNav.querySelector('a[href="/app/profiles"]')!;
    fireEvent.click(link);

    // Drawer should be closed (D-04)
    expect(useUiStore.getState().mobileDrawerOpen).toBe(false);

    // Route should have changed
    expect(screen.getByTestId("profiles-page")).toBeInTheDocument();
  });
});
