import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
  createdAt: string;
}

export interface AuthState {
  status: "resolving" | "authenticated" | "unauthenticated";
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "resolving",
  accessToken: null,
  user: null,
  setSession: (user, accessToken) =>
    set({ status: "authenticated", user, accessToken }),
  clearSession: () =>
    set({ status: "unauthenticated", user: null, accessToken: null }),
}));
