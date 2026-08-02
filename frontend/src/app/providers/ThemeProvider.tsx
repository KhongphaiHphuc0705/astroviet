import { useEffect } from "react";

import { usePreferenceStore } from "@shared/stores/preferenceStore";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { preference, resolvedTheme, _setResolvedTheme } = usePreferenceStore();

  // 1. Sync preference to resolvedTheme and listen to OS changes
  useEffect(() => {
    let expectedTheme: "light" | "dark" = "light";

    if (preference === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      expectedTheme = mql.matches ? "dark" : "light";

      const listener = (e: MediaQueryListEvent) => {
        _setResolvedTheme(e.matches ? "dark" : "light");
      };

      mql.addEventListener("change", listener);

      if (resolvedTheme !== expectedTheme) {
        _setResolvedTheme(expectedTheme);
      }

      return () => mql.removeEventListener("change", listener);
    } else {
      expectedTheme = preference as "light" | "dark";
      if (resolvedTheme !== expectedTheme) {
        _setResolvedTheme(expectedTheme);
      }
    }
  }, [preference, resolvedTheme, _setResolvedTheme]);

  // 2. Sync resolvedTheme to DOM attribute
  useEffect(() => {
    const currentDomTheme = document.documentElement.getAttribute("data-theme");
    if (currentDomTheme !== resolvedTheme) {
      document.documentElement.setAttribute("data-theme", resolvedTheme);
    }
  }, [resolvedTheme]);

  return <>{children}</>;
}
