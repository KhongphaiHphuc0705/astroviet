import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { Alert } from "./index";

describe("Alert", () => {
  it("renders info alert by default with title", () => {
    render(<Alert title="Information" data-testid="alert" />);
    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("role", "status");
    expect(alert).toHaveClass("bg-info/10", "text-info");
    expect(screen.getByText("Information")).toBeInTheDocument();
  });

  it("renders danger alert with correct role", () => {
    render(
      <Alert variant="danger" title="Error occurred" data-testid="alert" />,
    );
    const alert = screen.getByTestId("alert");
    expect(alert).toHaveAttribute("role", "alert");
    expect(alert).toHaveClass("bg-danger/10", "text-danger");
  });

  it("renders warning alert with correct role", () => {
    render(<Alert variant="warning" title="Warning" data-testid="alert" />);
    const alert = screen.getByTestId("alert");
    expect(alert).toHaveAttribute("role", "alert");
  });

  it("renders success alert with correct role", () => {
    render(<Alert variant="success" title="Success" data-testid="alert" />);
    const alert = screen.getByTestId("alert");
    expect(alert).toHaveAttribute("role", "status");
  });

  it("renders description and actions", () => {
    render(
      <Alert
        title="Title"
        description="Detailed description"
        actions={<button data-testid="action-btn">Action</button>}
      />,
    );
    expect(screen.getByText("Detailed description")).toBeInTheDocument();
    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const handleDismiss = vi.fn();
    render(<Alert title="Dismissible" onDismiss={handleDismiss} />);
    const dismissBtn = screen.getByLabelText("Đóng");
    expect(dismissBtn).toBeInTheDocument();
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("passes accessibility check for status role", async () => {
    const { container } = render(
      <Alert variant="info" title="Accessible info" description="Desc" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes accessibility check for alert role", async () => {
    const { container } = render(
      <Alert variant="danger" title="Accessible danger" description="Desc" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
