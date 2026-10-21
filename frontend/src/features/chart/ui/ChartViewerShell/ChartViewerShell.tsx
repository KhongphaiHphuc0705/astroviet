import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { useMediaQuery } from "@shared/hooks/useMediaQuery";
import { usePreferenceStore } from "@shared/stores/preferenceStore";
import { Alert } from "@shared/ui/Alert";
import { Card } from "@shared/ui/Card";
import { Switch } from "@shared/ui/Switch";

import { buildAspectGeometry } from "../../model/aspectGeometry";
import type {
  AspectKey,
  ChartViewModel,
  PlanetKey,
} from "../../model/chartViewModel";
import {
  buildLiveMessage,
  computeEmphasis,
  INITIAL_INTERACTION_STATE,
  interactionReducer,
  resolvePreview,
  resolveSelection,
  type InteractionTarget,
} from "../../model/selection";
import { buildWheelGeometry } from "../../model/wheelGeometry";
import { AspectTable } from "../AspectTable";
import { AspectLegend, ChartWheel } from "../ChartWheel";
import { HouseTable } from "../HouseTable";
import { PlanetTable } from "../PlanetTable";
import { SelectionDetail } from "../SelectionDetail";

import { formatCalculatedAt } from "./formatCalculatedAt";
import { HouseDataNotice } from "./HouseDataNotice";

export const ASPECT_LINES_DEFAULT_QUERY = "(min-width: 768px)";

export interface ChartViewerShellProps {
  vm: ChartViewModel;
  className?: string;
}

export function ChartViewerShell({ vm, className }: ChartViewerShellProps) {
  const hintId = useId();
  const isTable = useMediaQuery("(min-width: 640px)");
  const layout = isTable ? "table" : "cards";
  const density = usePreferenceStore((s) => s.densityMode);
  const wheelGeometry = useMemo(() => buildWheelGeometry(vm), [vm]);

  const aspectGeometry = useMemo(
    () => buildAspectGeometry(vm.aspects, vm.planets, wheelGeometry.rotation),
    [vm.aspects, vm.planets, wheelGeometry.rotation],
  );

  const matchesMd = useMediaQuery(ASPECT_LINES_DEFAULT_QUERY);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const showAspectLines = userChoice ?? matchesMd;

  // Milestone F4-M8: Interaction & Selection State Management
  const [interactionState, dispatch] = useReducer(
    interactionReducer,
    INITIAL_INTERACTION_STATE,
  );

  const availableKeys = useMemo(
    () => ({
      planetKeys: new Set(vm.planets.map((p) => p.key)),
      aspectKeys: new Set(vm.aspects.map((a) => a.key)),
    }),
    [vm.planets, vm.aspects],
  );

  const effectiveSelection = useMemo(
    () => resolveSelection(interactionState.selection, availableKeys),
    [interactionState.selection, availableKeys],
  );

  const preview = useMemo(
    () => resolvePreview(interactionState.focused, interactionState.hovered),
    [interactionState.focused, interactionState.hovered],
  );

  const emphasis = useMemo(
    () => computeEmphasis(effectiveSelection, preview, vm),
    [effectiveSelection, preview, vm],
  );

  const filterPlanetKey =
    effectiveSelection.kind === "planet" ? effectiveSelection.key : null;

  const filterPlanet = useMemo(() => {
    if (!filterPlanetKey) return undefined;
    const p = vm.planets.find((item) => item.key === filterPlanetKey);
    return p
      ? {
          key: p.key,
          labelVi: p.nameVi,
          glyph: p.glyph,
          known: p.known,
        }
      : undefined;
  }, [filterPlanetKey, vm.planets]);

  const liveMessage = useMemo(
    () =>
      buildLiveMessage(interactionState.announcement, effectiveSelection, vm),
    [interactionState.announcement, effectiveSelection, vm],
  );

  const handlePreview = useCallback(
    (
      target: InteractionTarget,
      source: "hover" | "focus",
      phase: "enter" | "leave",
    ) => {
      if (phase === "enter") {
        dispatch(
          source === "hover"
            ? { type: "hoverEnter", target }
            : { type: "focusEnter", target },
        );
      } else {
        dispatch(
          source === "hover"
            ? { type: "hoverLeave", target }
            : { type: "focusLeave", target },
        );
      }
    },
    [],
  );

  const wheelInteraction = useMemo(
    () => ({
      selection: effectiveSelection,
      emphasis,
      onSelect: (target: InteractionTarget) =>
        dispatch({ type: "select", target }),
      onPreview: handlePreview,
    }),
    [effectiveSelection, emphasis, handlePreview],
  );

  const handleSelectPlanet = useCallback((key: PlanetKey) => {
    dispatch({ type: "select", target: { kind: "planet", key } });
  }, []);

  const handleSelectAspect = useCallback((key: AspectKey) => {
    dispatch({ type: "select", target: { kind: "aspect", key } });
  }, []);

  const handleClearSelection = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const handlePreviewPlanet = useCallback(
    (key: PlanetKey, source: "hover" | "focus", phase: "enter" | "leave") => {
      handlePreview({ kind: "planet", key }, source, phase);
    },
    [handlePreview],
  );

  const handlePreviewAspect = useCallback(
    (key: AspectKey, source: "hover" | "focus", phase: "enter" | "leave") => {
      handlePreview({ kind: "aspect", key }, source, phase);
    },
    [handlePreview],
  );

  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "escape" });
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className={className ?? "space-y-6"}
      data-testid="chart-viewer-shell"
    >
      {/* Polite centralized screen reader live region (D-M8-09) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

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

      <Card variant="raised" className="space-y-4 p-4 sm:p-6">
        {aspectGeometry.lines.length > 0 && (
          <div className="space-y-3">
            <Switch
              size="md"
              label="Hiện đường góc chiếu"
              checked={showAspectLines}
              onChange={(e) => setUserChoice(e.target.checked)}
              aria-describedby={hintId}
              description={
                <span id={hintId}>
                  Bật hoặc tắt các đường nối góc chiếu giữa các hành tinh trên
                  biểu đồ.
                </span>
              }
            />
            {showAspectLines && <AspectLegend legend={aspectGeometry.legend} />}
          </div>
        )}
        <ChartWheel
          vm={vm}
          geometry={wheelGeometry}
          aspectGeometry={aspectGeometry}
          showAspectLines={showAspectLines}
          interaction={wheelInteraction}
        />
        <SelectionDetail
          selection={effectiveSelection}
          vm={vm}
          onClear={handleClearSelection}
        />
      </Card>

      <PlanetTable
        planets={vm.planets}
        houseDataAvailable={vm.flags.houseDataAvailable}
        layout={layout}
        density={density}
        selectedKey={
          effectiveSelection.kind === "planet" ? effectiveSelection.key : null
        }
        onSelect={handleSelectPlanet}
        relatedKeys={emphasis.planets}
        onPreview={handlePreviewPlanet}
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

      <AspectTable
        aspects={vm.aspects}
        layout={layout}
        density={density}
        selectedKey={
          effectiveSelection.kind === "aspect" ? effectiveSelection.key : null
        }
        onSelect={handleSelectAspect}
        filterPlanetKey={filterPlanetKey}
        filterPlanet={filterPlanet}
        onClearFilter={handleClearSelection}
        onPreview={handlePreviewAspect}
      />
    </div>
  );
}
