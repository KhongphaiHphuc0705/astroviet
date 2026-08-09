import * as Resolvers from "@hookform/resolvers/zod";
import { renderHook } from "@testing-library/react";
import * as RHF from "react-hook-form";
import { vi, describe, it, expect, afterEach } from "vitest";
import { z } from "zod";

import { useZodForm } from "./useZodForm";

vi.mock("react-hook-form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-hook-form")>();
  return {
    ...actual,
    useForm: vi.fn(actual.useForm),
  };
});

vi.mock("@hookform/resolvers/zod", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@hookform/resolvers/zod")>();
  return {
    ...actual,
    zodResolver: vi.fn(actual.zodResolver),
  };
});

describe("useZodForm", () => {
  const schema = z.object({
    name: z.string().min(2),
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls useForm with default mode: onBlur and reValidateMode: onChange", () => {
    renderHook(() => useZodForm(schema));

    expect(RHF.useForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "onBlur",
        reValidateMode: "onChange",
      }),
    );
  });

  it("passes the schema to zodResolver", () => {
    renderHook(() => useZodForm(schema));

    expect(Resolvers.zodResolver).toHaveBeenCalledWith(schema);
  });

  it("wires the zodResolver output as the resolver option for useForm", () => {
    const mockResolver = vi.fn();
    vi.mocked(Resolvers.zodResolver).mockReturnValueOnce(mockResolver);

    renderHook(() => useZodForm(schema));

    expect(RHF.useForm).toHaveBeenCalledWith(
      expect.objectContaining({ resolver: mockResolver }),
    );
  });

  it("returns the complete useForm object (register, handleSubmit, formState, setFocus, control, reset)", () => {
    const { result } = renderHook(() => useZodForm(schema));

    expect(result.current.register).toBeTypeOf("function");
    expect(result.current.handleSubmit).toBeTypeOf("function");
    expect(result.current.setFocus).toBeTypeOf("function");
    expect(result.current.control).toBeDefined();
    expect(result.current.reset).toBeTypeOf("function");
    expect(result.current.formState).toBeDefined();
  });

  it("allows caller to override mode and reValidateMode via options", () => {
    renderHook(() =>
      useZodForm(schema, { mode: "onChange", reValidateMode: "onBlur" }),
    );

    expect(RHF.useForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "onChange",
        reValidateMode: "onBlur",
      }),
    );
  });

  it("forwards additional options (e.g. defaultValues) to useForm", () => {
    const defaultValues = { name: "Khách" };
    renderHook(() => useZodForm(schema, { defaultValues }));

    expect(RHF.useForm).toHaveBeenCalledWith(
      expect.objectContaining({ defaultValues }),
    );
  });
});
