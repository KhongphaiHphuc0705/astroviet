import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form";
import { type ZodType } from "zod";

export function useZodForm<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, "resolver">,
) {
  return useForm<TFieldValues>({
    resolver: zodResolver(
      schema as unknown as ZodType<TFieldValues, FieldValues>,
    ) as UseFormProps<TFieldValues>["resolver"],
    mode: "onBlur",
    reValidateMode: "onChange",
    ...options,
  });
}
