import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  // TODO(Core): Thêm activeModalId (string | null) nếu cần quản lý modal tập trung (Architecture Spec §7.3)
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
}));
