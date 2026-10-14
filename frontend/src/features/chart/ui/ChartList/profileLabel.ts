export interface ChartProfileLookup {
  status: "loading" | "error" | "ready";
  labelsById: ReadonlyMap<string, string>;
  isComplete: boolean;
}

export type ResolvedProfileLabelKind =
  "resolved" | "loading" | "unavailable" | "deleted" | "unknown";

export interface ResolvedProfileLabel {
  kind: ResolvedProfileLabelKind;
  text: string;
}

export const PROFILE_LABEL_FALLBACKS = {
  deleted: "Hồ sơ đã xoá hoặc không còn",
  loading: "Đang tải tên hồ sơ…",
  unavailable: "Không tải được tên hồ sơ",
  unknown: "Không xác định được hồ sơ",
} as const;

export function resolveChartProfileLabel(
  birthProfileId: string | null | undefined,
  lookup: ChartProfileLookup,
): ResolvedProfileLabel {
  if (
    !birthProfileId ||
    typeof birthProfileId !== "string" ||
    birthProfileId.trim() === ""
  ) {
    return {
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    };
  }

  if (lookup.status === "loading") {
    return {
      kind: "loading",
      text: PROFILE_LABEL_FALLBACKS.loading,
    };
  }

  if (lookup.status === "error") {
    return {
      kind: "unavailable",
      text: PROFILE_LABEL_FALLBACKS.unavailable,
    };
  }

  const foundLabel = lookup.labelsById.get(birthProfileId);
  if (foundLabel !== undefined) {
    return {
      kind: "resolved",
      text: foundLabel,
    };
  }

  if (lookup.isComplete) {
    return {
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    };
  }

  return {
    kind: "unknown",
    text: PROFILE_LABEL_FALLBACKS.unknown,
  };
}

export function buildChartItemAriaLabel(
  profileLabel: string,
  calculatedAtFormatted: string,
): string {
  return `Xem lá số: ${profileLabel}, tính lúc ${calculatedAtFormatted}`;
}
