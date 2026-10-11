import { describe, expect, it } from "vitest";

import {
  KNOWN_ANGLE_TYPES,
  KNOWN_ASPECT_NATURES,
  KNOWN_ASPECT_TYPES,
  KNOWN_HOUSE_SYSTEMS,
  KNOWN_PLANET_NAMES,
  KNOWN_ZODIAC_SIGNS,
} from "../api/types";

import {
  ANGLE_LABELS,
  APPLYING_LABEL_VI,
  ASPECT_TYPE_LABELS,
  formatHouseAriaLabel,
  formatHouseLabel,
  HOUSE_SYSTEM_LABELS,
  KNOWN_WARNING_CODES,
  NATURE_LABELS,
  PLANET_LABELS,
  resolveAngle,
  resolveAspectNature,
  resolveAspectType,
  resolveHouseSystem,
  resolvePlanet,
  resolveSign,
  resolveWarningCode,
  RETROGRADE_GLYPH,
  RETROGRADE_LABEL_VI,
  SEPARATING_LABEL_VI,
  SIGN_LABELS,
  UNKNOWN_LABEL_VI,
  WARNING_LABELS,
} from "./labels";

describe("labels and glyph registry (F4-M2.1)", () => {
  describe("B1: 14 chart objects / planets", () => {
    it("provides valid Vietnamese labels and Unicode glyphs for all known planets and points", () => {
      expect(Object.keys(PLANET_LABELS)).toHaveLength(14);
      expect(KNOWN_PLANET_NAMES).toHaveLength(14);

      for (const name of KNOWN_PLANET_NAMES) {
        const result = resolvePlanet(name);
        expect(result.known).toBe(true);
        expect(result.key).toBe(name);
        expect(result.labelVi.trim().length).toBeGreaterThan(0);
        expect(result.glyph).not.toBeNull();
      }
    });

    it("verifies exact glyph code points and labels for core and optional bodies", () => {
      expect(resolvePlanet("Sun")).toStrictEqual({
        key: "Sun",
        labelVi: "Mặt Trời",
        glyph: "\u2609",
        known: true,
      });
      expect(resolvePlanet("Moon")).toStrictEqual({
        key: "Moon",
        labelVi: "Mặt Trăng",
        glyph: "\u263D",
        known: true,
      });
      expect(resolvePlanet("Mercury")).toStrictEqual({
        key: "Mercury",
        labelVi: "Sao Thủy",
        glyph: "\u263F",
        known: true,
      });
      expect(resolvePlanet("Venus")).toStrictEqual({
        key: "Venus",
        labelVi: "Sao Kim",
        glyph: "\u2640",
        known: true,
      });
      expect(resolvePlanet("Mars")).toStrictEqual({
        key: "Mars",
        labelVi: "Sao Hỏa",
        glyph: "\u2642",
        known: true,
      });
      expect(resolvePlanet("Jupiter")).toStrictEqual({
        key: "Jupiter",
        labelVi: "Sao Mộc",
        glyph: "\u2643",
        known: true,
      });
      expect(resolvePlanet("Saturn")).toStrictEqual({
        key: "Saturn",
        labelVi: "Sao Thổ",
        glyph: "\u2644",
        known: true,
      });
      expect(resolvePlanet("Uranus")).toStrictEqual({
        key: "Uranus",
        labelVi: "Sao Thiên Vương",
        glyph: "\u2645",
        known: true,
      });
      expect(resolvePlanet("Neptune")).toStrictEqual({
        key: "Neptune",
        labelVi: "Sao Hải Vương",
        glyph: "\u2646",
        known: true,
      });
      expect(resolvePlanet("Pluto")).toStrictEqual({
        key: "Pluto",
        labelVi: "Sao Diêm Vương",
        glyph: "\u2647",
        known: true,
      });
      expect(resolvePlanet("Chiron")).toStrictEqual({
        key: "Chiron",
        labelVi: "Chiron",
        glyph: "\u26B7",
        known: true,
      });
      expect(resolvePlanet("Lilith")).toStrictEqual({
        key: "Lilith",
        labelVi: "Lilith",
        glyph: "\u26B8",
        known: true,
      });
      expect(resolvePlanet("NorthNode")).toStrictEqual({
        key: "NorthNode",
        labelVi: "Nút Bắc",
        glyph: "\u260A",
        known: true,
      });
      expect(resolvePlanet("SouthNode")).toStrictEqual({
        key: "SouthNode",
        labelVi: "Nút Nam",
        glyph: "\u260B",
        known: true,
      });
    });
  });

  describe("B2: 12 zodiac signs", () => {
    it("provides valid Vietnamese labels and text-presentation glyphs for all 12 signs", () => {
      expect(Object.keys(SIGN_LABELS)).toHaveLength(12);
      expect(KNOWN_ZODIAC_SIGNS).toHaveLength(12);

      const expectedLabels: Record<string, string> = {
        Aries: "Bạch Dương",
        Taurus: "Kim Ngưu",
        Gemini: "Song Tử",
        Cancer: "Cự Giải",
        Leo: "Sư Tử",
        Virgo: "Xử Nữ",
        Libra: "Thiên Bình",
        Scorpio: "Thiên Yết",
        Sagittarius: "Nhân Mã",
        Capricorn: "Ma Kết",
        Aquarius: "Bảo Bình",
        Pisces: "Song Ngư",
      };

      for (const sign of KNOWN_ZODIAC_SIGNS) {
        const result = resolveSign(sign);
        expect(result.known).toBe(true);
        expect(result.key).toBe(sign);
        expect(result.labelVi).toBe(expectedLabels[sign]);
        expect(result.glyph).not.toBeNull();
        expect(result.glyph?.endsWith("\uFE0E")).toBe(true);
      }
    });

    it("verifies exact sign glyph code points with VS15 suffix", () => {
      expect(resolveSign("Aries").glyph).toBe("\u2648\uFE0E");
      expect(resolveSign("Taurus").glyph).toBe("\u2649\uFE0E");
      expect(resolveSign("Gemini").glyph).toBe("\u264A\uFE0E");
      expect(resolveSign("Cancer").glyph).toBe("\u264B\uFE0E");
      expect(resolveSign("Leo").glyph).toBe("\u264C\uFE0E");
      expect(resolveSign("Virgo").glyph).toBe("\u264D\uFE0E");
      expect(resolveSign("Libra").glyph).toBe("\u264E\uFE0E");
      expect(resolveSign("Scorpio").glyph).toBe("\u264F\uFE0E");
      expect(resolveSign("Sagittarius").glyph).toBe("\u2650\uFE0E");
      expect(resolveSign("Capricorn").glyph).toBe("\u2651\uFE0E");
      expect(resolveSign("Aquarius").glyph).toBe("\u2652\uFE0E");
      expect(resolveSign("Pisces").glyph).toBe("\u2653\uFE0E");
    });
  });

  describe("B3: 5 aspect types", () => {
    it("provides accurate Vietnamese labels and Unicode glyphs", () => {
      expect(Object.keys(ASPECT_TYPE_LABELS)).toHaveLength(5);
      expect(KNOWN_ASPECT_TYPES).toHaveLength(5);

      expect(resolveAspectType("Conjunction")).toStrictEqual({
        key: "Conjunction",
        labelVi: "Hợp",
        glyph: "\u260C",
        known: true,
      });
      expect(resolveAspectType("Sextile")).toStrictEqual({
        key: "Sextile",
        labelVi: "Lục hợp",
        glyph: "\u26B9",
        known: true,
      });
      expect(resolveAspectType("Square")).toStrictEqual({
        key: "Square",
        labelVi: "Vuông chiếu",
        glyph: "\u25A1",
        known: true,
      });
      expect(resolveAspectType("Trine")).toStrictEqual({
        key: "Trine",
        labelVi: "Tam hợp",
        glyph: "\u25B3",
        known: true,
      });
      expect(resolveAspectType("Opposition")).toStrictEqual({
        key: "Opposition",
        labelVi: "Đối xung",
        glyph: "\u260D",
        known: true,
      });
    });
  });

  describe("B4: 4 angles", () => {
    it("provides short labels, Vietnamese labels, and accessibility ariaLabels", () => {
      expect(Object.keys(ANGLE_LABELS)).toHaveLength(4);
      expect(KNOWN_ANGLE_TYPES).toHaveLength(4);

      expect(resolveAngle("Ascendant")).toStrictEqual({
        key: "Ascendant",
        shortLabel: "ASC",
        labelVi: "Cung Mọc",
        ariaLabel: "Cung Mọc (Ascendant)",
        known: true,
      });
      expect(resolveAngle("Midheaven")).toStrictEqual({
        key: "Midheaven",
        shortLabel: "MC",
        labelVi: "Thiên Đỉnh",
        ariaLabel: "Thiên Đỉnh (Midheaven)",
        known: true,
      });
      expect(resolveAngle("Descendant")).toStrictEqual({
        key: "Descendant",
        shortLabel: "DSC",
        labelVi: "Cung Lặn",
        ariaLabel: "Cung Lặn (Descendant)",
        known: true,
      });
      expect(resolveAngle("ImumCoeli")).toStrictEqual({
        key: "ImumCoeli",
        shortLabel: "IC",
        labelVi: "Thiên Để",
        ariaLabel: "Thiên Để (Imum Coeli)",
        known: true,
      });
    });
  });

  describe("B5: 2 house systems", () => {
    it("maps house systems properly with null glyphs", () => {
      expect(Object.keys(HOUSE_SYSTEM_LABELS)).toHaveLength(2);
      expect(KNOWN_HOUSE_SYSTEMS).toHaveLength(2);

      expect(resolveHouseSystem("Placidus")).toStrictEqual({
        key: "Placidus",
        labelVi: "Placidus",
        glyph: null,
        known: true,
      });
      expect(resolveHouseSystem("WholeSign")).toStrictEqual({
        key: "WholeSign",
        labelVi: "Whole Sign",
        glyph: null,
        known: true,
      });
    });
  });

  describe("B6: 3 aspect natures", () => {
    it("maps aspect natures and resolves UI tones accurately", () => {
      expect(Object.keys(NATURE_LABELS)).toHaveLength(3);
      expect(KNOWN_ASPECT_NATURES).toHaveLength(3);

      expect(resolveAspectNature("Harmonious")).toStrictEqual({
        key: "Harmonious",
        labelVi: "Hài hòa",
        tone: "harmonious",
        known: true,
      });
      expect(resolveAspectNature("Challenging")).toStrictEqual({
        key: "Challenging",
        labelVi: "Căng thẳng",
        tone: "tense",
        known: true,
      });
      expect(resolveAspectNature("Neutral")).toStrictEqual({
        key: "Neutral",
        labelVi: "Trung tính",
        tone: "neutral",
        known: true,
      });
    });
  });

  describe("B7: pins canonical order of KNOWN_* arrays", () => {
    it("ensures KNOWN_PLANET_NAMES array order cannot change without test modification", () => {
      expect([...KNOWN_PLANET_NAMES]).toStrictEqual([
        "Sun",
        "Moon",
        "Mercury",
        "Venus",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto",
        "Chiron",
        "NorthNode",
        "SouthNode",
        "Lilith",
      ]);
    });

    it("ensures KNOWN_ZODIAC_SIGNS order is strictly canonical", () => {
      expect([...KNOWN_ZODIAC_SIGNS]).toStrictEqual([
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
      ]);
    });

    it("ensures KNOWN_ASPECT_TYPES order is strictly canonical", () => {
      expect([...KNOWN_ASPECT_TYPES]).toStrictEqual([
        "Conjunction",
        "Sextile",
        "Square",
        "Trine",
        "Opposition",
      ]);
    });

    it("ensures KNOWN_ANGLE_TYPES order is strictly canonical", () => {
      expect([...KNOWN_ANGLE_TYPES]).toStrictEqual([
        "Ascendant",
        "Midheaven",
        "Descendant",
        "ImumCoeli",
      ]);
    });

    it("ensures KNOWN_HOUSE_SYSTEMS order is strictly canonical", () => {
      expect([...KNOWN_HOUSE_SYSTEMS]).toStrictEqual(["Placidus", "WholeSign"]);
    });

    it("ensures KNOWN_ASPECT_NATURES order is strictly canonical", () => {
      expect([...KNOWN_ASPECT_NATURES]).toStrictEqual([
        "Harmonious",
        "Challenging",
        "Neutral",
      ]);
    });
  });

  describe("B8: unknown values and prototype safety", () => {
    const unknownCases = [
      { input: "Vesta", expectedKey: "Vesta", expectedLabel: "Vesta" },
      { input: "", expectedKey: "", expectedLabel: UNKNOWN_LABEL_VI },
      { input: "   ", expectedKey: "   ", expectedLabel: UNKNOWN_LABEL_VI },
      { input: null, expectedKey: "null", expectedLabel: UNKNOWN_LABEL_VI },
      {
        input: undefined,
        expectedKey: "undefined",
        expectedLabel: UNKNOWN_LABEL_VI,
      },
      { input: 42, expectedKey: "42", expectedLabel: UNKNOWN_LABEL_VI },
      {
        input: "constructor",
        expectedKey: "constructor",
        expectedLabel: "constructor",
      },
      {
        input: "__proto__",
        expectedKey: "__proto__",
        expectedLabel: "__proto__",
      },
      {
        input: "toString",
        expectedKey: "toString",
        expectedLabel: "toString",
      },
    ];

    it("safely handles unknown planet keys without crashing or returning known labels", () => {
      for (const tc of unknownCases) {
        const result = resolvePlanet(tc.input);
        expect(result.known).toBe(false);
        expect(result.key).toBe(tc.expectedKey);
        expect(result.labelVi).toBe(tc.expectedLabel);
        expect(result.glyph).toBeNull();
      }
    });

    it("safely handles unknown zodiac sign keys", () => {
      for (const tc of unknownCases) {
        const result = resolveSign(tc.input);
        expect(result.known).toBe(false);
        expect(result.key).toBe(tc.expectedKey);
        expect(result.labelVi).toBe(tc.expectedLabel);
        expect(result.glyph).toBeNull();
      }
    });

    it("safely handles unknown aspect types", () => {
      for (const tc of unknownCases) {
        const result = resolveAspectType(tc.input);
        expect(result.known).toBe(false);
        expect(result.key).toBe(tc.expectedKey);
        expect(result.labelVi).toBe(tc.expectedLabel);
        expect(result.glyph).toBeNull();
      }
    });

    it("safely handles unknown angles", () => {
      for (const tc of unknownCases) {
        const result = resolveAngle(tc.input);
        expect(result.known).toBe(false);
        expect(result.key).toBe(tc.expectedKey);
        expect(result.shortLabel).toBeNull();
        expect(result.labelVi).toBe(tc.expectedLabel);
        expect(result.ariaLabel).toBe(tc.expectedLabel);
      }
    });

    it("safely handles unknown house systems", () => {
      for (const tc of unknownCases) {
        const result = resolveHouseSystem(tc.input);
        expect(result.known).toBe(false);
        expect(result.key).toBe(tc.expectedKey);
        expect(result.labelVi).toBe(tc.expectedLabel);
        expect(result.glyph).toBeNull();
      }
    });

    it("safely handles unknown aspect natures", () => {
      for (const tc of unknownCases) {
        const result = resolveAspectNature(tc.input);
        expect(result.known).toBe(false);
        expect(result.key).toBe(tc.expectedKey);
        expect(result.labelVi).toBe(tc.expectedLabel);
        expect(result.tone).toBe("unknown");
      }
    });

    it("safely handles unknown warning codes", () => {
      for (const tc of unknownCases) {
        const result = resolveWarningCode(tc.input);
        expect(result.known).toBe(false);
        expect(result.code).toBe(tc.expectedKey);
        expect(result.labelVi).toBeNull();
      }
    });
  });

  describe("B9: warning labels", () => {
    it("maps known HOUSE_SYSTEM_NOT_CONVERGING warning code to Vietnamese explanation", () => {
      expect(KNOWN_WARNING_CODES).toContain("HOUSE_SYSTEM_NOT_CONVERGING");
      const result = resolveWarningCode("HOUSE_SYSTEM_NOT_CONVERGING");
      expect(result).toStrictEqual({
        code: "HOUSE_SYSTEM_NOT_CONVERGING",
        labelVi: WARNING_LABELS.HOUSE_SYSTEM_NOT_CONVERGING,
        known: true,
      });
      expect(result.labelVi).toBe(
        "Không tính được chính xác hệ nhà tại vị trí này.",
      );
    });
  });

  describe("B10: retrograde, applying, and house formatting constants", () => {
    it("exports correct retrograde glyph and label", () => {
      expect(RETROGRADE_GLYPH).toBe("\u211E");
      expect(RETROGRADE_LABEL_VI).toBe("Nghịch hành");
    });

    it("exports correct applying and separating labels", () => {
      expect(APPLYING_LABEL_VI).toBe("Đang tới gần");
      expect(SEPARATING_LABEL_VI).toBe("Đang rời xa");
    });

    it("formats house label and aria label correctly", () => {
      expect(formatHouseLabel(1)).toBe("Nhà 1");
      expect(formatHouseLabel(12)).toBe("Nhà 12");
      expect(formatHouseAriaLabel(1)).toBe("Nhà thứ 1");
      expect(formatHouseAriaLabel(10)).toBe("Nhà thứ 10");
    });
  });
});
