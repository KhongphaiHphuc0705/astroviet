import type { MouseEvent } from "react";

import type { InterpretationGroup } from "../../model/interpretation";

import {
  formatCount,
  getInterpretationGroupHeadingId,
  INTERPRETATION_COPY,
} from "./interpretationCopy";

export interface InterpretationOverviewProps {
  availableCount: number;
  groups: readonly InterpretationGroup[];
  houseDataAvailable: boolean;
  onGroupLinkClick: (id: InterpretationGroup["id"]) => void;
}

export function InterpretationOverview({
  availableCount,
  groups,
  houseDataAvailable,
  onGroupLinkClick,
}: InterpretationOverviewProps) {
  function handleLinkClick(
    event: MouseEvent<HTMLAnchorElement>,
    id: InterpretationGroup["id"],
  ) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onGroupLinkClick(id);
  }

  return (
    <div className="grid gap-3">
      <p>{formatCount(availableCount)}</p>
      {groups.length > 0 && (
        <nav aria-label={INTERPRETATION_COPY.navigationLabel}>
          <ul className="flex flex-wrap gap-3">
            {groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#${getInterpretationGroupHeadingId(group.id)}`}
                  onClick={(event) => handleLinkClick(event, group.id)}
                >
                  {INTERPRETATION_COPY.groups[group.id]} ({group.itemIds.length}
                  )
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {!houseDataAvailable && <p>{INTERPRETATION_COPY.houseDataUnavailable}</p>}
      <p>{INTERPRETATION_COPY.coverage}</p>
      <p>{INTERPRETATION_COPY.disclaimer}</p>
    </div>
  );
}
