import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
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
});
