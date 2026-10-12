import { Alert } from "@shared/ui/Alert";
import { Card } from "@shared/ui/Card";

import type { ChartViewModel } from "../../model/chartViewModel";

import { formatCalculatedAt } from "./formatCalculatedAt";
import { HouseDataNotice } from "./HouseDataNotice";

export interface ChartViewerShellProps {
  vm: ChartViewModel;
  className?: string;
}

export function ChartViewerShell({ vm, className }: ChartViewerShellProps) {
  return (
    <div className={className ?? "space-y-6"} data-testid="chart-viewer-shell">
      <Card className="p-4 sm:p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-body-sm text-subtle">Hệ nhà</dt>
            <dd className="text-body-base font-medium text-primary">
              {vm.meta.houseSystem.labelVi}
            </dd>
          </div>
          <div>
            <dt className="text-body-sm text-subtle">Tính lúc</dt>
            <dd className="text-body-base font-medium text-primary">
              <time dateTime={vm.meta.calculatedAt}>
                {formatCalculatedAt(vm.meta.calculatedAt)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-body-sm text-subtle">Phiên bản engine</dt>
            <dd className="text-body-sm text-subtle">
              {vm.meta.engineVersion}
            </dd>
          </div>
        </dl>
      </Card>

      {!vm.flags.houseDataAvailable && (
        <HouseDataNotice warnings={vm.warnings} />
      )}

      {vm.flags.partialData && (
        <Alert
          variant="warning"
          title="Dữ liệu chưa đầy đủ"
          description="Một số dữ liệu của lá số chưa thể hiển thị đầy đủ."
        />
      )}

      <Card
        data-testid="chart-visualization-placeholder"
        className="border-dashed p-8 text-center text-subtle"
      >
        <p>
          Biểu đồ tròn và các bảng hành tinh, nhà, góc chiếu sẽ xuất hiện ở đây.
        </p>
      </Card>
    </div>
  );
}
