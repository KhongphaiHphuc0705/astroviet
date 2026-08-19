import { describe, expect, it, beforeEach } from "vitest";

import { useUiStore } from "./uiStore";

describe("uiStore", () => {
  // Reset store to initial state before each test
  beforeEach(() => {
    useUiStore.setState({
      sidebarCollapsed: false,
      mobileDrawerOpen: false,
    });
  });

  it("should have correct default state", () => {
    const state = useUiStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.mobileDrawerOpen).toBe(false);
  });

  it("toggleSidebar should toggle sidebarCollapsed boolean correctly", () => {
    const stateBefore = useUiStore.getState();
    expect(stateBefore.sidebarCollapsed).toBe(false);

    // First toggle
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    // Second toggle
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("setMobileDrawerOpen should set mobileDrawerOpen boolean correctly", () => {
    const stateBefore = useUiStore.getState();
    expect(stateBefore.mobileDrawerOpen).toBe(false);

    useUiStore.getState().setMobileDrawerOpen(true);
    expect(useUiStore.getState().mobileDrawerOpen).toBe(true);

    useUiStore.getState().setMobileDrawerOpen(false);
    expect(useUiStore.getState().mobileDrawerOpen).toBe(false);
  });
});
