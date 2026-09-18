import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useLoginMutation } from "@features/auth/hooks/useLoginMutation";
import { loginSchema, type LoginFormValues } from "@features/auth/model/schema";
import { useZodForm } from "@shared/hooks/useZodForm";
import { getInputFieldProps } from "@shared/lib/formFields";
import { getSafeRedirectDestination } from "@shared/lib/redirect-url";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { Stack } from "@shared/ui/Stack";

export default function LoginPage() {
  const form = useZodForm<LoginFormValues>(loginSchema);
  const loginMutation = useLoginMutation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const destination = getSafeRedirectDestination(searchParams.get("redirect"));

  const onSubmit = form.handleSubmit((values) => {
    loginMutation.mutate(values, {
      onSuccess: () => navigate(destination, { replace: true }),
    });
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-heading-md font-semibold">
          ĐĂNG NHẬP
        </h1>
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

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={loginMutation.isPending}
          >
            Đăng nhập
          </Button>
        </Stack>
      </form>

      <div className="text-center text-body-md">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="text-accent-primary underline-offset-4 hover:underline"
        >
          Đăng ký
        </Link>
      </div>
    </div>
  );
}
