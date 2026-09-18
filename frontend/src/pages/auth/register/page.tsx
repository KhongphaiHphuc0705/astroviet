import { Link } from "react-router-dom";

import {
  registerSchema,
  type RegisterFormValues,
} from "@features/auth/model/schema";
import { useZodForm } from "@shared/hooks/useZodForm";
import { getInputFieldProps } from "@shared/lib/formFields";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { Stack } from "@shared/ui/Stack";

export default function RegisterPage() {
  const form = useZodForm<RegisterFormValues>(registerSchema);

  const onSubmit = form.handleSubmit(() => {
    // Step 6 & 7 will be implemented later
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-heading-md font-semibold">ĐĂNG KÝ</h1>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <Stack gap="4">
          <Input
            label="Email"
            labelClassName="normal-case"
            placeholder="Nhập địa chỉ email"
            {...getInputFieldProps("email", form)}
          />

          <Input
            label="Mật khẩu"
            labelClassName="normal-case"
            type="password"
            placeholder="Nhập mật khẩu"
            {...getInputFieldProps("password", form)}
          />

          <Input
            label="Xác nhận mật khẩu"
            labelClassName="normal-case"
            type="password"
            placeholder="Nhập lại mật khẩu"
            {...getInputFieldProps("confirmPassword", form)}
          />

          <Input
            label="Tên hiển thị"
            labelClassName="normal-case"
            placeholder="Nhập tên hiển thị (tùy chọn)"
            {...getInputFieldProps("displayName", form, {
              setValueAs: (v: unknown) => (v === "" ? undefined : v),
            })}
          />

          <Button type="submit" variant="primary" className="w-full">
            Đăng ký
          </Button>
        </Stack>
      </form>

      <div className="text-center text-body-md">
        Đã có tài khoản?{" "}
        <Link
          to="/login"
          className="text-accent-primary underline-offset-4 hover:underline"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
