import { useMediaQuery } from "@shared/hooks/useMediaQuery";
import { usePreferenceStore } from "@shared/stores/preferenceStore";
import { Alert } from "@shared/ui/Alert";
import { Card } from "@shared/ui/Card";

import type { ChartViewModel } from "../../model/chartViewModel";
import { AspectTable } from "../AspectTable";
import { HouseTable } from "../HouseTable";
import { PlanetTable } from "../PlanetTable";

import { formatCalculatedAt } from "./formatCalculatedAt";
import { HouseDataNotice } from "./HouseDataNotice";

export interface ChartViewerShellProps {
  vm: ChartViewModel;
  className?: string;
}

export function ChartViewerShell({ vm, className }: ChartViewerShellProps) {
  const isTable = useMediaQuery("(min-width: 640px)");
  const layout = isTable ? "table" : "cards";
  const density = usePreferenceStore((s) => s.densityMode);

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
        <p>Biểu đồ tròn sẽ xuất hiện ở đây.</p>
      </Card>

      <PlanetTable
        planets={vm.planets}
        houseDataAvailable={vm.flags.houseDataAvailable}
        layout={layout}
        density={density}
      />

      <HouseTable
        houses={vm.houses}
        angles={vm.angles}
        houseDataAvailable={vm.flags.houseDataAvailable}
        hasAngles={vm.flags.hasAngles}
        houseSystemLabel={vm.meta.houseSystem.labelVi}
        unavailableContent={<HouseDataNotice warnings={vm.warnings} />}
        layout={layout}
        density={density}
      />

      <AspectTable aspects={vm.aspects} layout={layout} density={density} />
    </div>
  );
}
