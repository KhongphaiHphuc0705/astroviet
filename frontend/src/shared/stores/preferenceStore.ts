import { create } from "zustand";
import { persist } from "zustand/middleware";

import { THEME_STORAGE_KEY } from "./../config/constants";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface PreferenceState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  locale: "vi" | "en";
  densityMode: "comfortable" | "compact";
  setPreference: (preference: ThemePreference) => void;
  _setResolvedTheme: (resolvedTheme: ResolvedTheme) => void;
  setLocale: (locale: "vi" | "en") => void;
  setDensityMode: (mode: "comfortable" | "compact") => void;
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
      locale: "vi",
      densityMode: "comfortable",
      setPreference: (preference) => set({ preference }),
      _setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
      setLocale: (locale) => set({ locale }),
      setDensityMode: (densityMode) => set({ densityMode }),
    }),
    {
      name: THEME_STORAGE_KEY,
      // Persist preference, locale, and densityMode
      partialize: (state) => ({
        preference: state.preference,
        locale: state.locale,
        densityMode: state.densityMode,
      }),
    },
  ),
);
