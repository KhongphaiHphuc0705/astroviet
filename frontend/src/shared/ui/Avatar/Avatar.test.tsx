import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Avatar } from "./index";

describe("Avatar", () => {
  it("renders image when src is provided and valid", () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="John Doe" />);
    const img = screen.getByRole("img", { name: "John Doe" });
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe("IMG");
  });

  it("renders correct initials when no src is provided", () => {
    render(<Avatar name="Huu Phuc" data-testid="avatar-no-src" />);
    const avatar = screen.getByTestId("avatar-no-src");

    // M6 Spec §3.13 criteria: aria-label in initials branch
    expect(avatar).toHaveAttribute("role", "img");
    expect(avatar).toHaveAttribute("aria-label", "Huu Phuc");
    expect(avatar.textContent).toBe("HP"); // Initials
  });

  it("renders correct initials when image fails to load", () => {
    render(
      <Avatar
        src="https://example.com/broken.jpg"
        name="John Doe"
        data-testid="avatar-error"
      />,
    );

    const img = screen.getByRole("img", { name: "John Doe" });

    // Simulate image load error
    fireEvent.error(img);

    // It should now render initials instead of img
    const avatar = screen.getByTestId("avatar-error");

    // M6 Spec §3.13 criteria: aria-label in error fallback branch
    expect(avatar).toHaveAttribute("role", "img");
    expect(avatar).toHaveAttribute("aria-label", "John Doe");
    expect(avatar.textContent).toBe("JD"); // Initials
    expect(
      screen.queryByRole("img", { name: "John Doe", hidden: false }),
    ).not.toHaveAttribute("src"); // Inner img is gone
  });

  it("renders Skeleton when isLoading is true", () => {
    render(<Avatar name="John Doe" isLoading data-testid="avatar-skeleton" />);
    const skeleton = screen.getByTestId("avatar-skeleton");

    // Verify it composed Skeleton
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("rounded-full"); // circular variant
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });

  it("applies correct size classes", () => {
    const { rerender } = render(
      <Avatar name="Test User" size="xs" data-testid="avatar" />,
    );
    expect(screen.getByTestId("avatar")).toHaveClass("h-6", "w-6");

    rerender(<Avatar name="Test User" size="sm" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveClass("h-8", "w-8");

    rerender(<Avatar name="Test User" size="lg" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveClass("h-14", "w-14");
  });

  it("passes accessibility check", async () => {
    const { container } = render(<Avatar name="A11y Test" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
