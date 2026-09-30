import { useNavigate } from "react-router-dom";

import type { CreateBirthProfileInput } from "@features/birth-profile/api/types";
import { useCreateBirthProfileMutation } from "@features/birth-profile/hooks/useCreateBirthProfileMutation";
import {
  BirthProfileForm,
  type BirthProfileFormValues,
} from "@features/birth-profile/ui/BirthProfileForm";
import { getErrorMessage } from "@shared/lib/error-messages";
import { Alert } from "@shared/ui/Alert";
import { Container } from "@shared/ui/Container";

export default function BirthProfileCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateBirthProfileMutation();

  const handleSubmit = (values: BirthProfileFormValues) => {
    const payload: CreateBirthProfileInput = {
      ...(values as CreateBirthProfileInput),
      label: values.fullName.trim(),
    };
    mutation.mutate(payload, {
      onSuccess: () => setTimeout(() => navigate("/app/profiles"), 2000),
    });
  };

  return (
    <Container className="py-8">
      <h1 className="text-display-sm mb-8 font-semibold text-primary">
        Tạo hồ sơ sinh mới
      </h1>
      <div className="mb-6 space-y-4">
        {mutation.isSuccess && (
          <Alert
            variant="success"
            title="Tạo hồ sơ thành công! Đang chuyển về danh sách..."
          />
        )}
        {mutation.isError && !mutation.isSuccess && (
          <Alert
            variant="danger"
            title={getErrorMessage(mutation.error.errorCode)}
          />
        )}
      </div>
      <BirthProfileForm
        onSubmit={handleSubmit}
        isLoading={mutation.isPending || mutation.isSuccess}
      />
    </Container>
  );
}
