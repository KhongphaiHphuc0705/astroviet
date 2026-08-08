import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { axe } from "vitest-axe";

import { Modal } from "./index";

describe("Modal", () => {
  beforeEach(() => {
    const modalRoot = document.createElement("div");
    modalRoot.setAttribute("id", "modal-root");
    document.body.appendChild(modalRoot);
  });

  afterEach(() => {
    const root = document.getElementById("modal-root");
    if (root) document.body.removeChild(root);
    document.body.innerHTML = "";
  });

  it("renders when isOpen is true", () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test Modal" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("does not render when isOpen is false initially", () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test Modal" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when overlay is clicked", () => {
    const handleClose = vi.fn();
    render(<Modal isOpen={true} onClose={handleClose} title="Title" />);

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose on overlay click if closeOnOverlayClick is false", () => {
    const handleClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Title"
        closeOnOverlayClick={false}
      />,
    );

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<Modal isOpen={true} onClose={handleClose} title="Title" />);

    const closeBtn = screen.getByTestId("modal-close-btn");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Esc is pressed", () => {
    const handleClose = vi.fn();
    render(<Modal isOpen={true} onClose={handleClose} title="Title" />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("delays unmount for exit animation", async () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={handleClose} title="Animation Test" />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Rerender with isOpen=false
    rerender(
      <Modal isOpen={false} onClose={handleClose} title="Animation Test" />,
    );

    // Immediately after, it should STILL be in the document (opacity-0, scale-95)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("modal-container")).toHaveClass("scale-95");

    // After 320ms, it should be removed
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("traps focus within the modal using Tab and Shift+Tab", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Test">
        <button data-testid="content-btn">Content Button</button>
      </Modal>,
    );

    const closeBtn = screen.getByTestId("modal-close-btn");
    const contentBtn = screen.getByTestId("content-btn");

    // Wait for initial focus (useFocusTrap uses setTimeout 10ms)
    await waitFor(() => {
      expect(closeBtn).toHaveFocus();
    });

    // Press Tab, focus should move to contentBtn
    await user.tab();
    expect(contentBtn).toHaveFocus();

    // Press Tab again, focus should wrap around to closeBtn
    await user.tab();
    expect(closeBtn).toHaveFocus();

    // Press Shift+Tab, focus should wrap backwards to contentBtn
    await user.tab({ shift: true });
    expect(contentBtn).toHaveFocus();
  });

  it("restores focus to previous active element on close", async () => {
    // Render a button outside modal to hold initial focus
    const { rerender } = render(
      <div>
        <button data-testid="trigger-btn">Trigger</button>
      </div>,
    );
    const trigger = screen.getByTestId("trigger-btn");
    trigger.focus();
    expect(trigger).toHaveFocus();

    const handleClose = vi.fn();
    rerender(
      <div>
        <button data-testid="trigger-btn">Trigger</button>
        <Modal isOpen={true} onClose={handleClose} title="Focus Restore" />
      </div>,
    );

    // Focus moves into modal
    const closeBtn = screen.getByTestId("modal-close-btn");
    await waitFor(() => {
      expect(closeBtn).toHaveFocus();
    });

    // Close the modal
    rerender(
      <div>
        <button data-testid="trigger-btn">Trigger</button>
        <Modal isOpen={false} onClose={handleClose} title="Focus Restore" />
      </div>,
    );

    // Wait for the exit animation (320ms) and focus restore delay (10ms)
    await waitFor(
      () => {
        expect(trigger).toHaveFocus();
      },
      { timeout: 1000 },
    );
  });

  it("passes accessibility check", async () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="A11y Modal"
        description="Desc"
      >
        <div>Content</div>
      </Modal>,
    );
    const results = await axe(document.body); // Check body since it renders in portal
    expect(results).toHaveNoViolations();
  });
});
