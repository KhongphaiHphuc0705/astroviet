import { Link, useNavigate } from "react-router-dom";

import { useRegisterMutation } from "@features/auth/hooks/useRegisterMutation";
import {
  registerSchema,
  type RegisterFormValues,
} from "@features/auth/model/schema";
import { useZodForm } from "@shared/hooks/useZodForm";
import { getErrorMessage } from "@shared/lib/error-messages";
import { getInputFieldProps } from "@shared/lib/formFields";
import { Alert } from "@shared/ui/Alert";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { Stack } from "@shared/ui/Stack";

export default function RegisterPage() {
  const form = useZodForm<RegisterFormValues>(registerSchema);
  const registerMutation = useRegisterMutation();
  const navigate = useNavigate();

  const onSubmit = form.handleSubmit((values) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } =
      values as unknown as RegisterFormValues;
    if (payload.displayName === "") {
      delete payload.displayName;
    }
    registerMutation.mutate(payload, {
      onSuccess: () => {
        setTimeout(() => navigate("/login"), 2000);
      },
      onError: (error) => {
        if (error.errorCode === "EMAIL_ALREADY_EXISTS") {
          form.setError("email", {
            message: getErrorMessage("EMAIL_ALREADY_EXISTS"),
          });
        }
      },
    });
  });

  // Determine if there is a generic API error (not EMAIL_ALREADY_EXISTS which is handled field-level)
  const isGenericError =
    registerMutation.isError &&
    registerMutation.error?.errorCode !== "EMAIL_ALREADY_EXISTS";

  const isFormDisabled =
    registerMutation.isPending || registerMutation.isSuccess;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-heading-md font-semibold">ĐĂNG KÝ</h1>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <Stack gap="4">
          {registerMutation.isSuccess && (
            <Alert
              variant="success"
              title="Đăng ký thành công! Đang chuyển tới trang đăng nhập..."
            />
          )}

          {isGenericError && registerMutation.error && (
            <Alert
              variant="danger"
              title={getErrorMessage(registerMutation.error.errorCode || "")}
            />
          )}

          <Input
            label="Email"
            labelClassName="normal-case"
            placeholder="Nhập địa chỉ email"
            disabled={isFormDisabled}
            {...getInputFieldProps("email", form)}
          />

          <Input
            label="Mật khẩu"
            labelClassName="normal-case"
            type="password"
            placeholder="Nhập mật khẩu"
            disabled={isFormDisabled}
            {...getInputFieldProps("password", form)}
          />

          <Input
            label="Xác nhận mật khẩu"
            labelClassName="normal-case"
            type="password"
            placeholder="Nhập lại mật khẩu"
            disabled={isFormDisabled}
            {...getInputFieldProps("confirmPassword", form)}
          />

          <Input
            label="Tên hiển thị"
            labelClassName="normal-case"
            placeholder="Nhập tên hiển thị (tùy chọn)"
            disabled={isFormDisabled}
            {...getInputFieldProps("displayName", form, {
              setValueAs: (v: unknown) => (v === "" ? undefined : v),
            })}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={registerMutation.isPending}
            disabled={isFormDisabled}
          >
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
