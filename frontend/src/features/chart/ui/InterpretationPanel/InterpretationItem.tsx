import { ChevronDown } from "lucide-react";
import { useId } from "react";

import { cn } from "@shared/lib/cn";

import type { InterpretationPart } from "../../model/interpretation";

import {
  formatItemLabel,
  formatViewOnChartLabel,
  INTERPRETATION_COPY,
} from "./interpretationCopy";

export interface InterpretationItemProps {
  id: string;
  title: string;
  glyph: string | null;
  signLabel: string | null;
  houseLabel: string | null;
  bySign: InterpretationPart;
  byHouse: InterpretationPart | null;
  expanded: boolean;
  selected?: boolean;
  onToggle: (id: string) => void;
  onViewOnChart?: (id: string) => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
}

function getPartText(part: InterpretationPart): string {
  if (part.state === "available") return part.bodyText;
  if (part.state === "unavailable" && part.reason === "ANGLE_ABSENT") {
    return INTERPRETATION_COPY.ascendantUnavailable;
  }
  if (
    part.state === "unavailable" &&
    part.reason === "HOUSE_DATA_UNAVAILABLE"
  ) {
    return "";
  }
  return INTERPRETATION_COPY.itemMissing;
}

function PartRow({ label, part }: { label: string; part: InterpretationPart }) {
  const text = getPartText(part);
  if (!text) return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
      <dt className="font-semibold text-subtle">{label}</dt>
      <dd className="max-w-prose text-body-sm leading-relaxed text-primary">
        {text}
      </dd>
    </div>
  );
}

export function InterpretationItem({
  id,
  title,
  glyph,
  signLabel,
  houseLabel,
  bySign,
  byHouse,
  expanded,
  selected = false,
  onToggle,
  onViewOnChart,
  buttonRef,
}: InterpretationItemProps) {
  const panelId = useId();
  const accessibleName = formatItemLabel(title, signLabel ?? "");

  return (
    <article
      className={cn(
        "border-b border-subtle py-3 transition-colors last:border-b-0 motion-reduce:transition-none",
        selected &&
          "bg-surface-raised/40 ring-accent-primary/60 rounded-md px-2 ring-1",
      )}
    >
      <h4 className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={accessibleName}
          aria-current={selected ? "true" : undefined}
          onClick={() => onToggle(id)}
          className="flex min-h-[44px] flex-1 scroll-mt-20 items-center gap-3 rounded-sm py-1 text-left font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {glyph && <span aria-hidden="true">{glyph}</span>}
          <span>
            {title}
            {signLabel && (
              <span className="font-normal">{` \u00b7 ${signLabel}`}</span>
            )}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "ml-auto h-4 w-4 transition-transform motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
          />
        </button>
        {selected && (
          <span className="py-0.5 shrink-0 rounded-full border border-subtle bg-surface-raised px-2 text-body-sm font-medium text-accent-primary">
            {INTERPRETATION_COPY.selectedBadge}
          </span>
        )}
      </h4>
      <div id={panelId} hidden={!expanded}>
        <dl className="mt-3 grid max-w-prose gap-3 text-body-sm">
          <PartRow label={INTERPRETATION_COPY.parts.bySign} part={bySign} />
          {byHouse &&
            !(
              byHouse.state === "unavailable" &&
              byHouse.reason === "HOUSE_DATA_UNAVAILABLE"
            ) && (
              <PartRow
                label={
                  houseLabel
                    ? formatItemLabel(
                        INTERPRETATION_COPY.parts.byHouse,
                        houseLabel,
                      )
                    : INTERPRETATION_COPY.parts.byHouse
                }
                part={byHouse}
              />
            )}
        </dl>
        {onViewOnChart && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onViewOnChart(id)}
              aria-label={formatViewOnChartLabel(title)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-subtle bg-surface px-3 text-body-sm font-medium transition-all hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:h-8 sm:min-h-8"
            >
              {INTERPRETATION_COPY.viewOnChart}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
