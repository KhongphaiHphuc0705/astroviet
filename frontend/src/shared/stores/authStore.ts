import { create } from "zustand";

export interface AuthState {
  status: "resolving" | "authenticated" | "unauthenticated";
  accessToken: string | null;
  user: { id: string; email: string } | null;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Mô phỏng độ trễ silent-refresh, sau đó fallback về unauthenticated
  // (Architecture Spec §7.3/§6.4, Sprint F1 Plan §10.3/§11.5)
  setTimeout(() => {
    // Chỉ set về unauthenticated nếu vẫn đang resolving
    set((state) => {
      if (state.status === "resolving") {
        return { status: "unauthenticated" };
      }
      return state;
    });
  }, 100);

  return {
    status: "resolving",
    accessToken: null,
    user: null,
    login: () => {
      // Stub cho Sprint F1 - Logic thật sẽ nằm ở F2
    },
    logout: () => {
      set({ status: "unauthenticated", accessToken: null, user: null });
    },
  };
});
