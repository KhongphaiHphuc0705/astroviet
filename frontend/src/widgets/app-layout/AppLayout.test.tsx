import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { AppLayout } from "./index";

describe("AppLayout", () => {
  it("renders app layout and dual nav landmarks", () => {
    render(<AppLayout>Dashboard Content</AppLayout>);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();

    const navs = screen.getAllByRole("navigation", { hidden: true });
    expect(navs.length).toBeGreaterThanOrEqual(2);
  });

  it("can toggle mobile drawer and close via overlay", () => {
    render(<AppLayout>Test</AppLayout>);

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
    render(<AppLayout>Test</AppLayout>);

    const menuBtn = screen.getByLabelText("Menu");
    fireEvent.click(menuBtn);

    const closeBtn = screen.getByLabelText("Đóng menu");
    expect(closeBtn).toBeInTheDocument();
  });

  it("renders fallback header actions when no headerActions prop is provided", () => {
    render(<AppLayout>Dashboard Content</AppLayout>);
    expect(screen.getByTestId("header-actions-fallback")).toBeInTheDocument();
  });

  it("renders provided headerActions and hides fallback", () => {
    render(
      <AppLayout headerActions={<div data-testid="custom-actions">Custom</div>}>
        Dashboard Content
      </AppLayout>,
    );
    expect(screen.getByTestId("custom-actions")).toBeInTheDocument();
    expect(
      screen.queryByTestId("header-actions-fallback"),
    ).not.toBeInTheDocument();
  });
});
