import { ChevronDown } from "lucide-react";
import { useId } from "react";

import type { InterpretationPart } from "../../model/interpretation";

import { formatItemLabel, INTERPRETATION_COPY } from "./interpretationCopy";

export interface InterpretationItemProps {
  id: string;
  title: string;
  glyph: string | null;
  signLabel: string | null;
  houseLabel: string | null;
  bySign: InterpretationPart;
  byHouse: InterpretationPart | null;
  expanded: boolean;
  onToggle: (id: string) => void;
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
      <dt className="font-semibold">{label}</dt>
      <dd>{text}</dd>
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
  onToggle,
}: InterpretationItemProps) {
  const panelId = useId();
  const accessibleName = formatItemLabel(title, signLabel ?? "");

  return (
    <article className="border-b border-subtle py-3 last:border-b-0">
      <h4>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={accessibleName}
          onClick={() => onToggle(id)}
          className="flex w-full items-center gap-3 text-left font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
            className={`ml-auto h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </h4>
      <div id={panelId} hidden={!expanded}>
        <dl className="mt-3 grid gap-3 text-body-sm">
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
      </div>
    </article>
  );
}
