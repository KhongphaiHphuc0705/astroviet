import { describe, it, expect, beforeEach } from "vitest";

import { usePreferenceStore } from "./preferenceStore";

describe("preferenceStore", () => {
  beforeEach(() => {
    usePreferenceStore.setState({
      preference: "system",
      resolvedTheme: "light",
    });
  });

  it("initializes with expected defaults", () => {
    const state = usePreferenceStore.getState();
    expect(state.preference).toBe("system");
  });

  it("updates preference via setPreference", () => {
    usePreferenceStore.getState().setPreference("dark");
    expect(usePreferenceStore.getState().preference).toBe("dark");
  });

  it("updates resolvedTheme via internal method", () => {
    usePreferenceStore.getState()._setResolvedTheme("dark");
    expect(usePreferenceStore.getState().resolvedTheme).toBe("dark");
  });
});
