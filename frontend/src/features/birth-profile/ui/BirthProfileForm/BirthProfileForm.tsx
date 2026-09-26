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

  const form = useZodForm(birthProfileFormSchema, {
    defaultValues: defaultValues ?? {
      label: "",
      fullName: null,
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
    const valid = await form.trigger(["label", "fullName"]);
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
            label="Tên hồ sơ *"
            placeholder="Ví dụ: Bản thân, Bạn gái..."
            {...getInputFieldProps("label", form)}
          />

          <Input
            label="Họ và tên"
            placeholder="Nhập họ và tên đầy đủ (không bắt buộc)"
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
            <Input
              label="Giờ sinh *"
              type="time"
              step={1}
              disabled={!isBirthTimeKnown}
              {...getInputFieldProps("birthTime", form)}
            />

            <div className="mt-1 flex items-center gap-2">
              <Checkbox
                id="isBirthTimeKnown-checkbox"
                {...checkboxProps}
                onChange={(e) => {
                  checkboxProps.onChange(e);
                  // Case A: toggle OFF -> clear birth time
                  if (!e.target.checked) {
                    setValue("birthTime", null, { shouldValidate: true });
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
