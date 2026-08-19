import { describe, it, expect, beforeEach } from "vitest";

import { usePreferenceStore } from "./preferenceStore";

describe("preferenceStore", () => {
  beforeEach(() => {
    usePreferenceStore.setState({
      preference: "system",
      resolvedTheme: "light",
      locale: "vi",
      densityMode: "comfortable",
    });
  });

  it("initializes with expected defaults", () => {
    const state = usePreferenceStore.getState();
    expect(state.preference).toBe("system");
    expect(state.locale).toBe("vi");
    expect(state.densityMode).toBe("comfortable");
  });

  it("updates preference via setPreference", () => {
    usePreferenceStore.getState().setPreference("dark");
    expect(usePreferenceStore.getState().preference).toBe("dark");
  });

  it("updates resolvedTheme via internal method", () => {
    usePreferenceStore.getState()._setResolvedTheme("dark");
    expect(usePreferenceStore.getState().resolvedTheme).toBe("dark");
  });

  it("updates locale via setLocale", () => {
    usePreferenceStore.getState().setLocale("en");
    expect(usePreferenceStore.getState().locale).toBe("en");
  });

  it("updates densityMode via setDensityMode", () => {
    usePreferenceStore.getState().setDensityMode("compact");
    expect(usePreferenceStore.getState().densityMode).toBe("compact");
  });

  it("persists preference, locale, and densityMode (partialize behavior)", () => {
    usePreferenceStore.setState({
      preference: "dark",
      resolvedTheme: "light", // Should not be persisted
      locale: "en",
      densityMode: "compact",
    });

    const persistOptions = usePreferenceStore.persist.getOptions();
    if (persistOptions.partialize) {
      const persistedState = persistOptions.partialize(
        usePreferenceStore.getState(),
      );

      expect(persistedState).toEqual({
        preference: "dark",
        locale: "en",
        densityMode: "compact",
      });
      // Ensure resolvedTheme is NOT persisted
      expect("resolvedTheme" in persistedState).toBe(false);
    } else {
      throw new Error("partialize not defined in persist options");
    }
  });
});
