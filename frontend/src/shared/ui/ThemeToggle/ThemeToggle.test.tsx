import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { usePreferenceStore } from "@shared/stores/preferenceStore";

import { ThemeToggle } from "./index";

describe("ThemeToggle", () => {
  beforeEach(() => {
    usePreferenceStore.setState({
      preference: "light",
      resolvedTheme: "light",
    });
  });

  it("renders with role switch and initial light state", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveAttribute(
      "aria-label",
      "Giao diện sáng, bấm để chuyển sang giao diện tối",
    );
  });

  it("toggles to dark theme on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggle = screen.getByRole("switch");
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveAttribute(
      "aria-label",
      "Giao diện tối, bấm để chuyển sang giao diện sáng",
    );
    expect(usePreferenceStore.getState().preference).toBe("dark");
    expect(usePreferenceStore.getState().resolvedTheme).toBe("dark");
  });

  it("toggles back to light theme on second click", async () => {
    usePreferenceStore.setState({
      preference: "dark",
      resolvedTheme: "dark",
    });

    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(usePreferenceStore.getState().preference).toBe("light");
    expect(usePreferenceStore.getState().resolvedTheme).toBe("light");
  });

  it("passes accessibility checks", async () => {
    const { container } = render(<ThemeToggle />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
