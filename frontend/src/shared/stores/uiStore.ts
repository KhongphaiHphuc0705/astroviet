import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
}));
