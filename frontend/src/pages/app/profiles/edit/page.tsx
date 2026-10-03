import { useNavigate, useParams } from "react-router-dom";

import type { UpdateBirthProfileInput } from "@features/birth-profile/api/types";
import { useBirthProfileQuery } from "@features/birth-profile/hooks/useBirthProfileQuery";
import { useUpdateBirthProfileMutation } from "@features/birth-profile/hooks/useUpdateBirthProfileMutation";
import {
  BirthProfileForm,
  type BirthProfileFormValues,
} from "@features/birth-profile/ui/BirthProfileForm";
import { toFormValues } from "@features/birth-profile/ui/BirthProfileForm";
import { getErrorMessage } from "@shared/lib/error-messages";
import { Alert } from "@shared/ui/Alert";
import { Container } from "@shared/ui/Container";
import { EmptyState } from "@shared/ui/EmptyState";
import { Skeleton } from "@shared/ui/Skeleton";

export default function BirthProfileEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading, isError } = useBirthProfileQuery(id);
  const mutation = useUpdateBirthProfileMutation();

  if (isLoading) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-8 h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (isError || !profile) {
    return (
      <Container className="py-8">
        <EmptyState
          variant="danger"
          title="Không thể tải hồ sơ"
          description="Hồ sơ không tồn tại hoặc bạn không có quyền truy cập."
        />
      </Container>
    );
  }

  const handleSubmit = (values: BirthProfileFormValues) => {
    const payload: UpdateBirthProfileInput = {
      ...(values as UpdateBirthProfileInput),
      label: values.fullName.trim(),
    };
    mutation.mutate(
      { id: id!, input: payload },
      {
        onSuccess: () => setTimeout(() => navigate("/app/profiles"), 2000),
      },
    );
  };

  return (
    <Container className="py-8">
      <h1 className="text-display-sm mb-8 font-semibold text-primary">
        Sửa hồ sơ sinh
      </h1>
      <div className="mb-6 space-y-4">
        {mutation.isSuccess && (
          <Alert
            variant="success"
            title="Cập nhật thành công! Đang chuyển về danh sách..."
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
        defaultValues={toFormValues(profile)}
        onSubmit={handleSubmit}
        isLoading={mutation.isPending || mutation.isSuccess}
      />
    </Container>
  );
}
