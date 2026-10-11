import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import { type ZodType } from "zod";

export function useZodForm<TFieldValues extends FieldValues = FieldValues>(
  schema: ZodType<TFieldValues, unknown>,
  options?: Omit<UseFormProps<TFieldValues>, "resolver">,
): UseFormReturn<TFieldValues> {
  return useForm<TFieldValues>({
    resolver: zodResolver(schema as never) as Resolver<TFieldValues>,
    mode: "onBlur",
    reValidateMode: "onChange",
    ...options,
  });
}
