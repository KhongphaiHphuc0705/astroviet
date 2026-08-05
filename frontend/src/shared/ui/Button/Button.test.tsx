import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "vitest-axe";

import { Button } from "./index";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("forwards ref successfully", () => {
    const ref = createRef<HTMLElement>();
    render(<Button ref={ref}>Focus me</Button>);

    expect(ref.current).not.toBeNull();
    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it("renders as anchor when href is provided or as='a' is used", () => {
    render(
      <>
        <Button href="https://example.com" variant="link">
          Link href
        </Button>
        <Button as="a" href="https://example.com" data-testid="as-a">
          Link as
        </Button>
      </>,
    );

    const linkHref = screen.getByRole("link", { name: "Link href" });
    expect(linkHref).toHaveAttribute("href", "https://example.com");

    const linkAs = screen.getByTestId("as-a");
    expect(linkAs.tagName).toBe("A");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click me
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("sets aria-busy when isLoading is true", () => {
    render(<Button isLoading>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).not.toBeDisabled(); // Native disabled is not used for isLoading
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("prevents layout shift when isLoading toggles (measures offsetWidth)", () => {
    const { rerender } = render(<Button>Submit form data</Button>);
    const button = screen.getByRole("button", { name: "Submit form data" });

    const initialWidth = button.offsetWidth;

    rerender(<Button isLoading>Submit form data</Button>);

    const loadingWidth = button.offsetWidth;
    expect(loadingWidth).toBe(initialWidth);

    const childrenSpan = button.querySelector("span");
    expect(childrenSpan).toHaveClass("opacity-0");
  });

  it("renders left and right icons", () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
      >
        Click
      </Button>,
    );
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("applies iconOnly sizing correctly", () => {
    render(<Button iconOnly size="sm" data-testid="icon-btn" />);
    const btn = screen.getByTestId("icon-btn");
    expect(btn).toHaveClass("w-9", "h-9");
  });

  it("passes accessibility check", async () => {
    const { container } = render(<Button>Accessible</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
