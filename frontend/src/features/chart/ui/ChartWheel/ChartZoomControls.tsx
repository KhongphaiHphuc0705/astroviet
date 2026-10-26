import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/Button";

import {
  canZoomIn,
  canZoomOut,
  DEFAULT_ZOOM,
  formatZoomPercent,
} from "../../model/zoom";

export interface ChartZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  className?: string;
}

export function ChartZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  className,
}: ChartZoomControlsProps) {
  const isZoomInDisabled = !canZoomIn(zoom);
  const isZoomOutDisabled = !canZoomOut(zoom);
  const isResetDisabled = zoom === DEFAULT_ZOOM;

  return (
    <div
      role="group"
      aria-label="Thu phóng biểu đồ"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Thu nhỏ biểu đồ"
        aria-disabled={isZoomOutDisabled}
        onClick={() => {
          if (!isZoomOutDisabled) {
            onZoomOut();
          }
        }}
        className={cn(
          "text-heading-xs min-h-[44px] min-w-[44px]",
          isZoomOutDisabled && "cursor-not-allowed opacity-50 active:scale-100",
        )}
      >
        −
      </Button>

      <output
        aria-label="Mức thu phóng"
        className="min-w-[3.5rem] select-none text-center font-data text-body-sm font-semibold text-primary"
      >
        {formatZoomPercent(zoom)}
      </output>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Phóng to biểu đồ"
        aria-disabled={isZoomInDisabled}
        onClick={() => {
          if (!isZoomInDisabled) {
            onZoomIn();
          }
        }}
        className={cn(
          "text-heading-xs min-h-[44px] min-w-[44px]",
          isZoomInDisabled && "cursor-not-allowed opacity-50 active:scale-100",
        )}
      >
        +
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Đặt lại thu phóng"
        aria-disabled={isResetDisabled}
        onClick={() => {
          if (!isResetDisabled) {
            onZoomReset();
          }
        }}
        className={cn(
          "min-h-[44px] text-body-sm",
          isResetDisabled && "cursor-not-allowed opacity-50 active:scale-100",
        )}
      >
        Đặt lại
      </Button>
    </div>
  );
}
