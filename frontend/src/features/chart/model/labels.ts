import type {
  AngleType,
  AspectNature,
  AspectType,
  HouseSystem,
  PlanetName,
  ZodiacSign,
} from "../api/types";

export interface GlyphLabel {
  readonly key: string;
  readonly labelVi: string;
  readonly glyph: string | null;
  readonly known: boolean;
}

export interface AngleLabel {
  readonly key: string;
  readonly shortLabel: string | null;
  readonly labelVi: string;
  readonly ariaLabel: string;
  readonly known: boolean;
}

export type NatureTone = "harmonious" | "tense" | "neutral" | "unknown";

export interface NatureLabel {
  readonly key: string;
  readonly labelVi: string;
  readonly tone: NatureTone;
  readonly known: boolean;
}

export interface WarningLabel {
  readonly code: string;
  readonly labelVi: string | null;
  readonly known: boolean;
}

export const PLANET_LABELS = {
  Sun: { labelVi: "Mặt Trời", glyph: "\u2609" },
  Moon: { labelVi: "Mặt Trăng", glyph: "\u263D" },
  Mercury: { labelVi: "Sao Thủy", glyph: "\u263F" },
  Venus: { labelVi: "Sao Kim", glyph: "\u2640" },
  Mars: { labelVi: "Sao Hỏa", glyph: "\u2642" },
  Jupiter: { labelVi: "Sao Mộc", glyph: "\u2643" },
  Saturn: { labelVi: "Sao Thổ", glyph: "\u2644" },
  Uranus: { labelVi: "Sao Thiên Vương", glyph: "\u2645" },
  Neptune: { labelVi: "Sao Hải Vương", glyph: "\u2646" },
  Pluto: { labelVi: "Sao Diêm Vương", glyph: "\u2647" },
  Chiron: { labelVi: "Chiron", glyph: "\u26B7" },
  Lilith: { labelVi: "Lilith", glyph: "\u26B8" },
  NorthNode: { labelVi: "Nút Bắc", glyph: "\u260A" },
  SouthNode: { labelVi: "Nút Nam", glyph: "\u260B" },
} as const satisfies Record<
  PlanetName,
  { readonly labelVi: string; readonly glyph: string }
>;

export const SIGN_LABELS = {
  Aries: { labelVi: "Bạch Dương", glyph: "\u2648\uFE0E" },
  Taurus: { labelVi: "Kim Ngưu", glyph: "\u2649\uFE0E" },
  Gemini: { labelVi: "Song Tử", glyph: "\u264A\uFE0E" },
  Cancer: { labelVi: "Cự Giải", glyph: "\u264B\uFE0E" },
  Leo: { labelVi: "Sư Tử", glyph: "\u264C\uFE0E" },
  Virgo: { labelVi: "Xử Nữ", glyph: "\u264D\uFE0E" },
  Libra: { labelVi: "Thiên Bình", glyph: "\u264E\uFE0E" },
  Scorpio: { labelVi: "Thiên Yết", glyph: "\u264F\uFE0E" },
  Sagittarius: { labelVi: "Nhân Mã", glyph: "\u2650\uFE0E" },
  Capricorn: { labelVi: "Ma Kết", glyph: "\u2651\uFE0E" },
  Aquarius: { labelVi: "Bảo Bình", glyph: "\u2652\uFE0E" },
  Pisces: { labelVi: "Song Ngư", glyph: "\u2653\uFE0E" },
} as const satisfies Record<
  ZodiacSign,
  { readonly labelVi: string; readonly glyph: string }
>;

export const ASPECT_TYPE_LABELS = {
  Conjunction: { labelVi: "Hợp", glyph: "\u260C" },
  Sextile: { labelVi: "Lục hợp", glyph: "\u26B9" },
  Square: { labelVi: "Vuông chiếu", glyph: "\u25A1" },
  Trine: { labelVi: "Tam hợp", glyph: "\u25B3" },
  Opposition: { labelVi: "Đối xung", glyph: "\u260D" },
} as const satisfies Record<
  AspectType,
  { readonly labelVi: string; readonly glyph: string }
>;

export const ANGLE_LABELS = {
  Ascendant: {
    shortLabel: "ASC",
    labelVi: "Cung Mọc",
    ariaLabel: "Cung Mọc (Ascendant)",
  },
  Midheaven: {
    shortLabel: "MC",
    labelVi: "Thiên Đỉnh",
    ariaLabel: "Thiên Đỉnh (Midheaven)",
  },
  Descendant: {
    shortLabel: "DSC",
    labelVi: "Cung Lặn",
    ariaLabel: "Cung Lặn (Descendant)",
  },
  ImumCoeli: {
    shortLabel: "IC",
    labelVi: "Thiên Để",
    ariaLabel: "Thiên Để (Imum Coeli)",
  },
} as const satisfies Record<
  AngleType,
  {
    readonly shortLabel: string;
    readonly labelVi: string;
    readonly ariaLabel: string;
  }
>;

export const HOUSE_SYSTEM_LABELS = {
  Placidus: { labelVi: "Placidus", glyph: null },
  WholeSign: { labelVi: "Whole Sign", glyph: null },
} as const satisfies Record<
  HouseSystem,
  { readonly labelVi: string; readonly glyph: null }
>;

export const NATURE_LABELS = {
  Harmonious: { labelVi: "Hài hòa", tone: "harmonious" },
  Challenging: { labelVi: "Căng thẳng", tone: "tense" },
  Neutral: { labelVi: "Trung tính", tone: "neutral" },
} as const satisfies Record<
  AspectNature,
  { readonly labelVi: string; readonly tone: NatureTone }
>;

export const KNOWN_WARNING_CODES = ["HOUSE_SYSTEM_NOT_CONVERGING"] as const;
export type KnownWarningCode = (typeof KNOWN_WARNING_CODES)[number];

export const WARNING_LABELS = {
  HOUSE_SYSTEM_NOT_CONVERGING:
    "Không tính được chính xác hệ nhà tại vị trí này.",
} as const satisfies Record<KnownWarningCode, string>;

export const RETROGRADE_GLYPH = "\u211E";
export const RETROGRADE_LABEL_VI = "Nghịch hành";
export const UNKNOWN_LABEL_VI = "Không rõ";
export const APPLYING_LABEL_VI = "Đang tới gần";
export const SEPARATING_LABEL_VI = "Đang rời xa";

function extractKeyAndFallback(raw: unknown): {
  rawKey: string;
  fallbackLabel: string;
} {
  if (typeof raw === "string") {
    const rawKey = raw;
    const fallbackLabel = raw.trim() !== "" ? raw : UNKNOWN_LABEL_VI;
    return { rawKey, fallbackLabel };
  }
  const rawKey = String(raw);
  return { rawKey, fallbackLabel: UNKNOWN_LABEL_VI };
}

export function resolvePlanet(key: unknown): GlyphLabel {
  if (typeof key === "string" && Object.hasOwn(PLANET_LABELS, key)) {
    const entry = PLANET_LABELS[key as PlanetName];
    return {
      key,
      labelVi: entry.labelVi,
      glyph: entry.glyph,
      known: true,
    };
  }
  const { rawKey, fallbackLabel } = extractKeyAndFallback(key);
  return {
    key: rawKey,
    labelVi: fallbackLabel,
    glyph: null,
    known: false,
  };
}

export function resolveSign(key: unknown): GlyphLabel {
  if (typeof key === "string" && Object.hasOwn(SIGN_LABELS, key)) {
    const entry = SIGN_LABELS[key as ZodiacSign];
    return {
      key,
      labelVi: entry.labelVi,
      glyph: entry.glyph,
      known: true,
    };
  }
  const { rawKey, fallbackLabel } = extractKeyAndFallback(key);
  return {
    key: rawKey,
    labelVi: fallbackLabel,
    glyph: null,
    known: false,
  };
}

export function resolveAspectType(key: unknown): GlyphLabel {
  if (typeof key === "string" && Object.hasOwn(ASPECT_TYPE_LABELS, key)) {
    const entry = ASPECT_TYPE_LABELS[key as AspectType];
    return {
      key,
      labelVi: entry.labelVi,
      glyph: entry.glyph,
      known: true,
    };
  }
  const { rawKey, fallbackLabel } = extractKeyAndFallback(key);
  return {
    key: rawKey,
    labelVi: fallbackLabel,
    glyph: null,
    known: false,
  };
}

export function resolveAngle(key: unknown): AngleLabel {
  if (typeof key === "string" && Object.hasOwn(ANGLE_LABELS, key)) {
    const entry = ANGLE_LABELS[key as AngleType];
    return {
      key,
      shortLabel: entry.shortLabel,
      labelVi: entry.labelVi,
      ariaLabel: entry.ariaLabel,
      known: true,
    };
  }
  const { rawKey, fallbackLabel } = extractKeyAndFallback(key);
  return {
    key: rawKey,
    shortLabel: null,
    labelVi: fallbackLabel,
    ariaLabel: fallbackLabel,
    known: false,
  };
}

export function resolveHouseSystem(key: unknown): GlyphLabel {
  if (typeof key === "string" && Object.hasOwn(HOUSE_SYSTEM_LABELS, key)) {
    const entry = HOUSE_SYSTEM_LABELS[key as HouseSystem];
    return {
      key,
      labelVi: entry.labelVi,
      glyph: entry.glyph,
      known: true,
    };
  }
  const { rawKey, fallbackLabel } = extractKeyAndFallback(key);
  return {
    key: rawKey,
    labelVi: fallbackLabel,
    glyph: null,
    known: false,
  };
}

export function resolveAspectNature(key: unknown): NatureLabel {
  if (typeof key === "string" && Object.hasOwn(NATURE_LABELS, key)) {
    const entry = NATURE_LABELS[key as AspectNature];
    return {
      key,
      labelVi: entry.labelVi,
      tone: entry.tone,
      known: true,
    };
  }
  const { rawKey, fallbackLabel } = extractKeyAndFallback(key);
  return {
    key: rawKey,
    labelVi: fallbackLabel,
    tone: "unknown",
    known: false,
  };
}

export function resolveWarningCode(code: unknown): WarningLabel {
  if (typeof code === "string" && Object.hasOwn(WARNING_LABELS, code)) {
    return {
      code,
      labelVi: WARNING_LABELS[code as KnownWarningCode],
      known: true,
    };
  }
  const rawCode = typeof code === "string" ? code : String(code);
  return {
    code: rawCode,
    labelVi: null,
    known: false,
  };
}

export function formatHouseLabel(houseNumber: number): string {
  return `Nhà ${houseNumber}`;
}

export function formatHouseAriaLabel(houseNumber: number): string {
  return `Nhà thứ ${houseNumber}`;
}
