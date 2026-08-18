import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form";

// ─── T1 Architecture Confirmation (M7 Plan AC §T1) ───────────────────────────
//
// Direct source read of M5 components — confirmed before writing any connector:
//
//   Input   → forwardRef<HTMLInputElement>, extends InputHTMLAttributes<HTMLInputElement>
//             onChange follows native DOM ChangeEvent signature.
//             → REGISTER: RHF register() wires directly, no shim needed.
//
//   Checkbox → forwardRef<HTMLInputElement>, extends InputHTMLAttributes<HTMLInputElement>
//             RHF auto-detects type="checkbox" and uses .checked instead of .value.
//             No `error` prop (gap noted in M7 Plan §4.5 — form renders error text manually).
//             → REGISTER: same as Input.
//
//   Select  → forwardRef<HTMLButtonElement>, onChange?: (value: string) => void
//             NOT a native DOM event signature — register() would pass a SyntheticEvent
//             where Select expects a bare string, causing a silent runtime mismatch.
//             → CONTROLLER: mandatory, not optional (M7 Plan §5.2).
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props to spread onto `<Select>` when wired through React Hook Form's Controller.
 * Includes `ref` so that `setFocus(fieldName)` works correctly (M7 Plan §5.3).
 */
export interface SelectFieldProps {
  name: string;
  /** Select's controlled value (bare string, not an event). */
  value: string;
  /** Bridges Controller's field.onChange → Select's (value: string) => void. */
  onChange: (value: string) => void;
  onBlur: () => void;
  /** Must be forwarded so RHF can call .focus() on the trigger button element. */
  ref: React.Ref<HTMLButtonElement>;
  /** Error message string or undefined — maps directly to Select's error prop. */
  error: string | undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type FormWithRegisterAndErrors<T extends FieldValues> = {
  register: UseFormRegister<T>;
  formState: { errors: Partial<Record<string, { message?: string }>> };
};

// ── Connectors ────────────────────────────────────────────────────────────────

/**
 * Returns props to spread directly onto `<Input {...getInputFieldProps(name, form)} />`.
 *
 * Uses `register()` (uncontrolled) — Input forwards ref to a real <input> element
 * and exposes standard DOM event signatures, so register() attaches without shims.
 *
 * @param name  Field name as defined in the Zod schema.
 * @param form  The form object returned by `useZodForm`.
 */
export function getInputFieldProps<T extends FieldValues>(
  name: FieldPath<T>,
  form: FormWithRegisterAndErrors<T>,
): ReturnType<UseFormRegister<T>> & { error: string | undefined } {
  const registered = form.register(name);
  const errorMessage = (
    form.formState.errors[name] as { message?: string } | undefined
  )?.message;
  return {
    ...registered,
    error: errorMessage,
  };
}

/**
 * Returns props to spread directly onto `<Checkbox {...getCheckboxFieldProps(name, form)} />`.
 *
 * Same mechanism as getInputFieldProps. Error is intentionally omitted because
 * Checkbox has no `error` prop — the form is responsible for rendering error text
 * below the checkbox (M7 Plan §4.5 / §6.3).
 *
 * @param name  Field name as defined in the Zod schema.
 * @param form  The form object returned by `useZodForm`.
 */
export function getCheckboxFieldProps<T extends FieldValues>(
  name: FieldPath<T>,
  form: FormWithRegisterAndErrors<T>,
): ReturnType<UseFormRegister<T>> {
  return form.register(name);
}

/**
 * Hook that wires a `<Select>` field through React Hook Form's Controller.
 *
 * Select MUST use Controller (not register) because its onChange signature is
 * `(value: string) => void`, not a native DOM ChangeEvent — using register()
 * would silently pass a SyntheticEvent where a string is expected (M7 Plan §5.2).
 *
 * The returned `ref` MUST be forwarded to `<Select ref={field.ref} />` so that
 * RHF's setFocus(fieldName) can locate the underlying button element (M7 §5.3).
 *
 * @param name     Field name as defined in the Zod schema.
 * @param control  The `control` object returned by `useZodForm`.
 */
export function useSelectField<T extends FieldValues>(
  name: FieldPath<T>,
  control: Control<T>,
): SelectFieldProps {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return {
    name: field.name,
    value: typeof field.value === "string" ? field.value : "",
    onChange: field.onChange,
    onBlur: field.onBlur,
    ref: field.ref,
    error: error?.message,
  };
}
