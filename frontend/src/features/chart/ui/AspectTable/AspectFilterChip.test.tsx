import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { resolvePlanet } from "../../model/labels";

import { AspectFilterChip } from "./AspectFilterChip";

describe("AspectFilterChip (nhóm F)", () => {
  const venus = resolvePlanet("Venus");

  it("F1 & F2: renders visible label with ✕ and accessible aria-label", () => {
    render(<AspectFilterChip planet={venus} onClear={vi.fn()} />);

    const button = screen.getByRole("button", {
      name: `Xóa bộ lọc theo ${venus.labelVi}`,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(`Đang lọc: ${venus.labelVi}`);
    expect(button).toHaveTextContent("✕");
  });

  it("F3: handles click, Enter, and Space key triggers exactly once", async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();

    render(<AspectFilterChip planet={venus} onClear={handleClear} />);

    const button = screen.getByRole("button", {
      name: `Xóa bộ lọc theo ${venus.labelVi}`,
    });

    // Click
    await user.click(button);
    expect(handleClear).toHaveBeenCalledTimes(1);

    // Enter
    button.focus();
    await user.keyboard("{Enter}");
    expect(handleClear).toHaveBeenCalledTimes(2);

    // Space
    await user.keyboard(" ");
    expect(handleClear).toHaveBeenCalledTimes(3);
  });

  it("F4: renders as plain text without button element when onClear is omitted", () => {
    render(<AspectFilterChip planet={venus} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(`Đang lọc: ${venus.labelVi}`)).toBeInTheDocument();
  });

  it("passes axe accessibility checks", async () => {
    const { container: buttonContainer } = render(
      <AspectFilterChip planet={venus} onClear={vi.fn()} />,
    );
    expect(await axe(buttonContainer)).toHaveNoViolations();

    const { container: textContainer } = render(
      <AspectFilterChip planet={venus} />,
    );
    expect(await axe(textContainer)).toHaveNoViolations();
  });
});
