import { Alert } from "@shared/ui/Alert";

import type { ChartWarningVM } from "../../model/chartViewModel";

export interface HouseDataNoticeProps {
  warnings?: ChartWarningVM[];
  className?: string;
}

export function HouseDataNotice({
  warnings = [],
  className,
}: HouseDataNoticeProps) {
  const notConvergingWarning = warnings.find(
    (w) => w.code === "HOUSE_SYSTEM_NOT_CONVERGING",
  );
  const extraMessage = notConvergingWarning?.labelVi ?? null;

  const baseDescription =
    "Lá số này hiển thị không có Nhà và các góc (Cung Mọc, MC, DSC, IC). Dữ liệu này chỉ có khi hệ thống tính được hệ nhà, điều này cần giờ sinh và không phải lúc nào cũng thực hiện được.";

  const description = extraMessage
    ? `${baseDescription} ${extraMessage}`
    : baseDescription;

  return (
    <Alert
      variant="info"
      title="Dữ liệu Nhà và các góc chưa khả dụng"
      description={description}
      className={className}
    />
  );
}
