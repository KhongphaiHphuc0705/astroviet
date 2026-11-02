import { useRef, useState } from "react";

import { Alert } from "@shared/ui/Alert";
import { Card } from "@shared/ui/Card";

import type { ChartViewModel } from "../../model/chartViewModel";
import type {
  InterpretationGroupId,
  InterpretationModel,
  InterpretationItem as ModelItem,
} from "../../model/interpretation";

import {
  formatHouseLabel,
  getInterpretationGroupHeadingId,
  INTERPRETATION_COPY,
} from "./interpretationCopy";
import { InterpretationItem } from "./InterpretationItem";
import { InterpretationOverview } from "./InterpretationOverview";

export interface InterpretationPanelProps {
  vm: ChartViewModel;
  model: InterpretationModel;
}

function getItemDisplay(item: ModelItem, vm: ChartViewModel) {
  if (item.kind === "planet") {
    const planet = vm.planets.find((entry) => entry.key === item.subject);
    if (!planet) return null;
    return {
      title: planet.nameVi,
      glyph: planet.glyph,
      signLabel: planet.sign.known ? planet.sign.labelVi : null,
      houseLabel:
        planet.houseNumber === null
          ? null
          : formatHouseLabel(planet.houseNumber),
    };
  }
  const angle = vm.angles.find((entry) => entry.key === "Ascendant");
  return {
    title: angle?.labelVi ?? "Cung Mọc",
    glyph: null,
    signLabel: angle?.sign.known ? angle.sign.labelVi : null,
    houseLabel: null,
  };
}

export function InterpretationPanel({ vm, model }: InterpretationPanelProps) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () =>
      new Set(model.groups.find((group) => group.id === "core")?.itemIds ?? []),
  );
  const headings = useRef<
    Partial<Record<InterpretationGroupId, HTMLHeadingElement | null>>
  >({});

  function toggleItem(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function focusGroup(id: InterpretationGroupId) {
    headings.current[id]?.focus();
  }

  const unpublished = model.issues.some(
    (issue) => issue.code === "CONTENT_NOT_PUBLISHED",
  );

  return (
    <Card as="section" aria-labelledby="interpretation-panel-title">
      <h2
        id="interpretation-panel-title"
        className="mb-4 text-heading-md font-semibold"
      >
        {INTERPRETATION_COPY.panelTitle}
      </h2>
      {model.status === "unavailable" ? (
        <Alert
          variant={unpublished ? "info" : "warning"}
          title={
            unpublished
              ? INTERPRETATION_COPY.unpublished
              : INTERPRETATION_COPY.unavailable
          }
        />
      ) : (
        <>
          <InterpretationOverview
            availableCount={model.availableCount}
            groups={model.groups}
            houseDataAvailable={model.houseDataAvailable}
            onGroupLinkClick={focusGroup}
          />
          <div className="mt-5 grid gap-5">
            {model.groups.map((group) => (
              <section
                key={group.id}
                aria-labelledby={getInterpretationGroupHeadingId(group.id)}
              >
                <h3
                  id={getInterpretationGroupHeadingId(group.id)}
                  tabIndex={-1}
                  ref={(node) => {
                    headings.current[group.id] = node;
                  }}
                  className="mb-2 text-heading-sm font-semibold focus:outline-none"
                >
                  {INTERPRETATION_COPY.groups[group.id]}
                </h3>
                <ul>
                  {group.itemIds.map((id) => {
                    const item = model.itemsById[id];
                    if (!item) return null;
                    const display = getItemDisplay(item, vm);
                    if (!display) return null;
                    return (
                      <li key={item.id}>
                        <InterpretationItem
                          id={item.id}
                          {...display}
                          bySign={item.bySign}
                          byHouse={item.byHouse}
                          expanded={expandedIds.has(item.id)}
                          onToggle={toggleItem}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
