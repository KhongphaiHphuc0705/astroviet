import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { useZodForm } from "@shared/hooks/useZodForm";

import {
  getCheckboxFieldProps,
  getInputFieldProps,
  useSelectField,
} from "./formFields";

// ── Shared test schema & form factory ─────────────────────────────────────────

const schema = z.object({
  username: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  country: z.string().min(1, "Vui lòng chọn quốc gia"),
  agree: z.literal(true, { error: "Bạn phải đồng ý" }),
});

type FormValues = z.infer<typeof schema>;

function renderForm(defaultValues?: Partial<Omit<FormValues, "agree">>) {
  return renderHook(() =>
    useZodForm(schema, {
      defaultValues: {
        username: "",
        country: "",
        ...defaultValues,
      },
    }),
  );
}

// ── getInputFieldProps ────────────────────────────────────────────────────────

describe("getInputFieldProps", () => {
  it("returns register props (name, ref, onChange, onBlur)", () => {
    const { result } = renderForm();
    const props = getInputFieldProps<FormValues>("username", result.current);

    expect(props.name).toBe("username");
    expect(props.ref).toBeTypeOf("function"); // RHF register ref is a callback ref
    expect(props.onChange).toBeTypeOf("function");
    expect(props.onBlur).toBeTypeOf("function");
  });

  it("returns error: undefined when the field has no error", () => {
    const { result } = renderForm();
    const props = getInputFieldProps<FormValues>("username", result.current);
    expect(props.error).toBeUndefined();
  });

  it("returns error message string when the field has a validation error", () => {
    // Manually inject an error into formState to test the connector in isolation
    const { result } = renderForm();
    const formWithError = {
      register: result.current.register,
      formState: {
        errors: { username: { message: "Tên tối thiểu 2 ký tự" } },
      },
    };
    const props = getInputFieldProps<FormValues>("username", formWithError);
    expect(props.error).toBe("Tên tối thiểu 2 ký tự");
  });

  it("does NOT include an error key for fields with no entry in errors", () => {
    const { result } = renderForm();
    const formWithPartialErrors = {
      register: result.current.register,
      formState: { errors: {} },
    };
    const props = getInputFieldProps<FormValues>(
      "username",
      formWithPartialErrors,
    );
    expect(props.error).toBeUndefined();
  });
});

// ── getCheckboxFieldProps ─────────────────────────────────────────────────────

describe("getCheckboxFieldProps", () => {
  it("returns register props (name, ref, onChange, onBlur)", () => {
    const { result } = renderForm();
    const props = getCheckboxFieldProps<FormValues>("agree", result.current);

    expect(props.name).toBe("agree");
    expect(props.ref).toBeTypeOf("function");
    expect(props.onChange).toBeTypeOf("function");
    expect(props.onBlur).toBeTypeOf("function");
  });

  it("does NOT include an error prop (Checkbox has no error prop — M7 Plan §4.5)", () => {
    const { result } = renderForm();
    const props = getCheckboxFieldProps<FormValues>("agree", result.current);

    // The object must not have an 'error' key at all — not even undefined.
    // This is the intentional design gap documented in M7 Plan §4.5.
    expect("error" in props).toBe(false);
  });
});

// ── useSelectField ────────────────────────────────────────────────────────────

describe("useSelectField", () => {
  it("returns value, onChange, onBlur, name, ref, error", () => {
    const { result } = renderHook(() => {
      const form = useZodForm(schema, {
        defaultValues: { username: "", country: "" },
      });
      return useSelectField<FormValues>("country", form.control);
    });

    const field = result.current;
    expect(field.name).toBe("country");
    expect(field.value).toBe("");
    expect(field.onChange).toBeTypeOf("function");
    expect(field.onBlur).toBeTypeOf("function");
    expect(field.error).toBeUndefined();
  });

  it("CRITICAL — returns ref so that setFocus(fieldName) can target the button element (M7 Plan §5.3)", () => {
    const { result } = renderHook(() => {
      const form = useZodForm(schema, {
        defaultValues: { username: "", country: "" },
      });
      return useSelectField<FormValues>("country", form.control);
    });

    // ref must be defined (not null/undefined) so RHF can attach it.
    // If this assertion fails, setFocus('country') will silently do nothing.
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref).not.toBeNull();
  });

  it("onChange accepts a plain string — bridging Controller to Select's signature", async () => {
    const { result } = renderHook(() => {
      const form = useZodForm(schema, {
        defaultValues: { username: "", country: "" },
      });
      return useSelectField<FormValues>("country", form.control);
    });

    // onChange must accept a string directly (not a DOM event).
    // This verifies the bridge between Controller's field.onChange and
    // Select's (value: string) => void signature (M7 Plan §5.2).
    await act(async () => {
      result.current.onChange("VN");
    });
    // If we reach here without throwing, the signature bridge is correct.
    expect(result.current.name).toBe("country");
  });

  it("returns error message string when field has a validation error", async () => {
    const { result } = renderHook(() => {
      const form = useZodForm(schema, {
        defaultValues: { username: "", country: "" },
      });
      return {
        field: useSelectField<FormValues>("country", form.control),
        trigger: form.trigger,
      };
    });

    // Trigger validation to force an error on the empty required field
    await act(async () => {
      await result.current.trigger("country");
    });

    // After trigger, the error should surface through the Controller's fieldState
    expect(result.current.field.error).toBe("Vui lòng chọn quốc gia");
  });
});
