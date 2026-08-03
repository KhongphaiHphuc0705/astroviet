import { create } from "zustand";
import { persist } from "zustand/middleware";

import { THEME_STORAGE_KEY } from "./../config/constants";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface PreferenceState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  _setResolvedTheme: (resolvedTheme: ResolvedTheme) => void;
}

// Read the initial resolved theme from DOM (set by index.html inline script)
const getInitialResolvedTheme = (): ResolvedTheme => {
  if (typeof document !== "undefined") {
    const domTheme = document.documentElement.getAttribute("data-theme");
    if (domTheme === "light" || domTheme === "dark") {
      return domTheme as ResolvedTheme;
    }
  }
  return "light";
};

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      preference: "system",
      resolvedTheme: getInitialResolvedTheme(),
      setPreference: (preference) => set({ preference }),
      _setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
    }),
    {
      name: THEME_STORAGE_KEY,
      // Only persist `preference`. `resolvedTheme` is a computed value.
      partialize: (state) => ({ preference: state.preference }),
    },
  ),
);
