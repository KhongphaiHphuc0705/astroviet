import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getErrorMessage } from "@shared/lib/error-messages";
import { reportError } from "@shared/lib/report-error";
import { Alert } from "@shared/ui/Alert";
import { Button } from "@shared/ui/Button";
import { Modal } from "@shared/ui/Modal";
import { RadioGroup, type RadioOption } from "@shared/ui/Radio";
import { Stack } from "@shared/ui/Stack";

import { isValidChartId } from "../../api/isValidChartId";
import { KNOWN_HOUSE_SYSTEMS, type HouseSystem } from "../../api/types";
import { useCreateNatalChartMutation } from "../../hooks/useCreateNatalChartMutation";
import { resolveHouseSystem } from "../../model/labels";

export interface CalculateChartTarget {
  id: string;
  displayName: string;
  isBirthTimeKnown: boolean;
}

export interface CalculateChartDialogProps {
  target: CalculateChartTarget;
  onClose: () => void;
}

const HOUSE_SYSTEM_OPTIONS: RadioOption[] = KNOWN_HOUSE_SYSTEMS.map(
  (system) => {
    const info = resolveHouseSystem(system);
    const description =
      system === "Placidus"
        ? "Phổ biến; chia nhà theo thời gian sinh."
        : "Mỗi cung hoàng đạo tương ứng một nhà.";
    return {
      value: system,
      label: info.labelVi,
      description,
    };
  },
);

function isHouseSystem(val: string): val is HouseSystem {
  return (KNOWN_HOUSE_SYSTEMS as readonly string[]).includes(val);
}

export function CalculateChartDialog({
  target,
  onClose,
}: CalculateChartDialogProps) {
  const navigate = useNavigate();
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("Placidus");
  const [invalidResponseError, setInvalidResponseError] = useState(false);

  const mutation = useCreateNatalChartMutation();
  const isPending = mutation.isPending;
  const isError = mutation.isError || invalidResponseError;

  const errorMessage = useMemo(() => {
    if (invalidResponseError) {
      return "Đã có lỗi xảy ra, vui lòng thử lại.";
    }
    if (!mutation.error) return null;
    return getErrorMessage(mutation.error.errorCode);
  }, [invalidResponseError, mutation.error]);

  const handleHouseSystemChange = (value: string) => {
    if (isHouseSystem(value)) {
      setHouseSystem(value);
    }
  };

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = () => {
    if (isPending) return;
    setInvalidResponseError(false);

    mutation.mutate(
      { profileId: target.id, houseSystem },
      {
        onSuccess: (chart) => {
          if (isValidChartId(chart.id)) {
            navigate(`/app/charts/${chart.id}`);
          } else {
            reportError(
              new Error("Invalid chart id in calculate response"),
              "calculate-chart",
            );
            setInvalidResponseError(true);
          }
        },
      },
    );
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      closeOnOverlayClick={!isPending}
      title="Tính lá số"
      description={`Chọn hệ nhà để tính lá số cho hồ sơ “${target.displayName}”.`}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={isPending}
          >
            {isError ? "Thử lại" : "Tính lá số"}
          </Button>
        </div>
      }
    >
      <Stack gap="4">
        {!target.isBirthTimeKnown && (
          <Alert
            variant="info"
            title="Hồ sơ này chưa có giờ sinh"
            description="Lá số vẫn được tính, nhưng Nhà và các góc (Cung Mọc, MC…) có thể không khả dụng, và vị trí của Mặt Trăng cùng một số điểm di chuyển nhanh có thể kém chắc chắn."
          />
        )}

        <RadioGroup
          label="Hệ nhà"
          name="houseSystem"
          value={houseSystem}
          onChange={handleHouseSystemChange}
          options={HOUSE_SYSTEM_OPTIONS}
          disabled={isPending}
        />

        {isError && errorMessage && (
          <Alert
            variant="danger"
            title="Không thể tính lá số"
            description={errorMessage}
          />
        )}

        {isPending && (
          <p role="status" className="text-body-sm text-secondary">
            Đang tính toán vị trí hành tinh…
          </p>
        )}
      </Stack>
    </Modal>
  );
}
