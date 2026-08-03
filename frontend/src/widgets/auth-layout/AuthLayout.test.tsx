import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { AuthLayout } from "./index";

describe("AuthLayout", () => {
  it("renders auth layout correctly", () => {
    render(<AuthLayout>Login Form</AuthLayout>);

    expect(screen.getByText("AstroViet")).toBeInTheDocument();
    expect(screen.getByText("Login Form")).toBeInTheDocument();
  });
});
