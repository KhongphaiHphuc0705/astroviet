import { Card } from "@shared/ui/Card";
import { Skeleton } from "@shared/ui/Skeleton";
import { Stack } from "@shared/ui/Stack";

export function ChartViewerSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="space-y-6"
      data-testid="chart-viewer-skeleton"
    >
      <span className="sr-only">Đang tải lá số…</span>

      {/* Metadata strip placeholder */}
      <Card className="p-4">
        <Stack direction="horizontal" gap="4" className="flex-wrap">
          <Skeleton variant="text" width="120px" height="20px" />
          <Skeleton variant="text" width="160px" height="20px" />
          <Skeleton variant="text" width="100px" height="20px" />
        </Stack>
      </Card>

      {/* Wheel area placeholder */}
      <Card className="flex items-center justify-center p-8">
        <div className="aspect-square w-full max-w-xl">
          <Skeleton variant="circular" className="h-full w-full" />
        </div>
      </Card>

      {/* Table rows placeholder */}
      <Card className="space-y-3 p-4">
        <Skeleton variant="text" width="40%" height="24px" />
        <Skeleton variant="text" height="32px" count={4} />
      </Card>
    </div>
  );
}
