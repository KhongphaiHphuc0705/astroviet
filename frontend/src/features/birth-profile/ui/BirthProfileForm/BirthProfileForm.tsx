import { useState } from "react";

import { useZodForm } from "@shared/hooks/useZodForm";
import {
  getInputFieldProps,
  getCheckboxFieldProps,
} from "@shared/lib/formFields";
import { Button } from "@shared/ui/Button";
import { Checkbox } from "@shared/ui/Checkbox";
import { Input } from "@shared/ui/Input";

import { LocationSearchField } from "./LocationSearchField";
import { birthProfileFormSchema } from "./schema";
import type { BirthProfileFormValues } from "./types";

interface BirthProfileFormProps {
  defaultValues?: Partial<BirthProfileFormValues>;
  onSubmit: (values: BirthProfileFormValues) => void;
  isLoading?: boolean;
}

export function BirthProfileForm({
  defaultValues,
  onSubmit,
  isLoading,
}: BirthProfileFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  // Separate display state for the HH:mm mask so partial input (1-3 digits)
  // is preserved across re-renders without writing an invalid value into RHF.
  const [birthTimeDisplay, setBirthTimeDisplay] = useState<string>(
    () => defaultValues?.birthTime?.slice(0, 5) ?? "",
  );

  const form = useZodForm(birthProfileFormSchema, {
    defaultValues: defaultValues ?? {
      label: "",
      fullName: "",
      birthDate: "",
      birthTime: null,
      isBirthTimeKnown: true,
      birthLocation: null,
    },
  });

  const { watch, setValue, control, handleSubmit } = form;

  const isBirthTimeKnown = watch("isBirthTimeKnown");
  const birthDate = watch("birthDate");

  const onNext = async () => {
    const valid = await form.trigger(["fullName"]);
    if (valid) {
      setStep(2);
    }
  };

  const onBack = () => {
    setStep(1);
  };

  // Case A/B implementation for BirthTime toggle
  const checkboxProps = getCheckboxFieldProps("isBirthTimeKnown", form);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {step === 1 && (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h3 mb-4 font-bold">Thông tin cơ bản</legend>

          <Input
            label="Họ và tên *"
            placeholder="Nhập họ và tên đầy đủ"
            {...getInputFieldProps("fullName", form)}
          />

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" onClick={onNext} variant="primary">
              Tiếp tục
            </Button>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h3 mb-4 font-bold">
            Ngày sinh và Địa điểm
          </legend>

          <Input
            label="Ngày sinh *"
            type="date"
            {...getInputFieldProps("birthDate", form, {
              onChange: () => {
                // Clear location when date changes
                setValue("birthLocation", null, { shouldValidate: true });
              },
            })}
          />

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="birthTime-input"
                className={`text-body-sm font-medium uppercase ${!isBirthTimeKnown ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Giờ sinh *
              </label>
              <input
                id="birthTime-input"
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="VD: 14:30"
                disabled={!isBirthTimeKnown}
                value={birthTimeDisplay}
                onChange={(e) => {
                  // Strip non-digits, keep max 4 digits, then insert colon after pos 2
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                  const display =
                    digits.length >= 3
                      ? `${digits.slice(0, 2)}:${digits.slice(2)}`
                      : digits;
                  setBirthTimeDisplay(display);
                  // Write HH:mm:00 into RHF only when input is complete (4 digits)
                  const rhfValue =
                    digits.length === 4
                      ? `${digits.slice(0, 2)}:${digits.slice(2)}:00`
                      : null;
                  setValue("birthTime", rhfValue, {
                    shouldValidate: digits.length === 4,
                  });
                }}
                className={`w-full rounded-md border bg-surface px-4 py-2 text-body-md text-primary outline-none transition-colors placeholder:text-muted focus:border-accent-primary focus:ring-1 focus:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                  form.formState.errors.birthTime
                    ? "border-danger"
                    : "border-strong"
                }`}
              />
              {form.formState.errors.birthTime && (
                <p className="text-body-sm text-danger">
                  {form.formState.errors.birthTime.message}
                </p>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <Checkbox
                id="isBirthTimeKnown-checkbox"
                checked={isBirthTimeKnown}
                {...checkboxProps}
                onChange={(e) => {
                  checkboxProps.onChange(e);
                  // Case A: toggle OFF -> clear birth time
                  if (!e.target.checked) {
                    setValue("birthTime", null, { shouldValidate: true });
                    setBirthTimeDisplay("");
                  }
                }}
              />
              <label
                htmlFor="isBirthTimeKnown-checkbox"
                className="cursor-pointer text-body-sm font-medium leading-none"
              >
                Tôi biết rõ giờ sinh của mình
              </label>
            </div>
          </div>

          <LocationSearchField control={control} birthDate={birthDate || ""} />

          <div className="mt-4 flex justify-between">
            <Button type="button" onClick={onBack} variant="secondary">
              Quay lại
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Hoàn tất
            </Button>
          </div>
        </fieldset>
      )}
    </form>
  );
}
