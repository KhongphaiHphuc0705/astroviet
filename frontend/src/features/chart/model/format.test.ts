import { describe, expect, it } from "vitest";

import {
  DEGREE_SIGN,
  EPS_MINUTES,
  formatDegreeMinute,
  MINUTE_SIGN,
} from "./format";

describe("formatDegreeMinute (F4-M2.2)", () => {
  describe("C1: standard and real-world fixture values", () => {
    it("formats known values from captured fixture accurately", () => {
      expect(formatDegreeMinute(10.516911069942353)).toBe("10°31′");
      expect(formatDegreeMinute(12.027048547453887)).toBe("12°01′");
      expect(formatDegreeMinute(0.5798951497815779)).toBe("0°34′");
      expect(formatDegreeMinute(14.89132122052622 % 30)).toBe("14°53′");
    });
  });

  describe("C2: zero and near-zero values", () => {
    it("handles zero exactly", () => {
      expect(formatDegreeMinute(0)).toBe("0°00′");
    });

    it("handles fractional degrees smaller than one minute", () => {
      // 0.0166 * 60 = 0.996 minutes, truncated down to 0
      expect(formatDegreeMinute(0.0166)).toBe("0°00′");
    });

    it("handles exactly one minute", () => {
      expect(formatDegreeMinute(1 / 60)).toBe("0°01′");
    });
  });

  describe("C3: upper boundaries and sign transitions", () => {
    it("formats degrees near the 30 degree sign boundary without spilling over", () => {
      expect(formatDegreeMinute(29.9999999)).toBe("29°59′");
    });

    it("formats degrees near the 360 circle boundary", () => {
      expect(formatDegreeMinute(359.99)).toBe("359°59′");
      expect(formatDegreeMinute(359 + 59 / 60)).toBe("359°59′");
    });
  });

  describe("C4: floating-point noise cancellation", () => {
    it("corrects floating point inaccuracies using EPS_MINUTES", () => {
      expect(formatDegreeMinute(15 + 23 / 60)).toBe("15°23′");
      expect(formatDegreeMinute(2 + 14 / 60)).toBe("2°14′");
      expect(formatDegreeMinute(0 + 34 / 60)).toBe("0°34′");
    });
  });

  describe("C5: truncation (floor) behavior per D-M2-2", () => {
    it("strictly truncates seconds instead of rounding to nearest minute", () => {
      // Moon: 29.347306392035534 -> ~29°20'50" -> floor yields 29°20′ (not 29°21′)
      expect(formatDegreeMinute(29.347306392035534)).toBe("29°20′");

      // Mars: 9.794845786909718 -> ~9°47'41" -> floor yields 9°47′ (not 9°48′)
      expect(formatDegreeMinute(9.794845786909718)).toBe("9°47′");

      // Jupiter-Sun orb: 5.328870761158669 -> ~5°19'43" -> floor yields 5°19′ (not 5°20′)
      expect(formatDegreeMinute(5.328870761158669)).toBe("5°19′");
    });
  });

  describe("C6: invalid and out-of-range inputs", () => {
    it("returns null for null and undefined", () => {
      expect(formatDegreeMinute(null)).toBeNull();
      expect(formatDegreeMinute(undefined)).toBeNull();
    });

    it("returns null for non-finite numbers", () => {
      expect(formatDegreeMinute(Number.NaN)).toBeNull();
      expect(formatDegreeMinute(Number.POSITIVE_INFINITY)).toBeNull();
      expect(formatDegreeMinute(Number.NEGATIVE_INFINITY)).toBeNull();
    });

    it("returns null for negative numbers and numbers >= 360", () => {
      expect(formatDegreeMinute(-0.0001)).toBeNull();
      expect(formatDegreeMinute(-1)).toBeNull();
      expect(formatDegreeMinute(360)).toBeNull();
      expect(formatDegreeMinute(360.0001)).toBeNull();
      expect(formatDegreeMinute(400)).toBeNull();
    });

    it("returns null for non-number types passed via runtime bypass", () => {
      // @ts-expect-error - testing defensive runtime checks
      expect(formatDegreeMinute("15")).toBeNull();
      // @ts-expect-error - testing defensive runtime checks
      expect(formatDegreeMinute({})).toBeNull();
    });
  });

  describe("C7: formatting structure and characters", () => {
    it("always pads minutes with 2 digits", () => {
      expect(formatDegreeMinute(5.05)).toBe("5°03′");
      expect(formatDegreeMinute(5.016666666666667)).toBe("5°01′");
      expect(formatDegreeMinute(5)).toBe("5°00′");
    });

    it("uses exact Unicode code points for degree and prime minute characters", () => {
      expect(DEGREE_SIGN).toBe("\u00B0");
      expect(MINUTE_SIGN).toBe("\u2032");
      expect(EPS_MINUTES).toBe(1e-9);

      const formatted = formatDegreeMinute(15.5);
      expect(formatted).toBe("15\u00B030\u2032");
      expect(formatted).not.toContain("'");
      expect(formatted).not.toContain('"');
      expect(formatted).not.toContain("\u2033");
      expect(formatted).not.toContain(" ");
    });
  });

  describe("C8: pure function determinism", () => {
    it("produces identical output on repeated calls", () => {
      const val = 123.456789;
      const first = formatDegreeMinute(val);
      const second = formatDegreeMinute(val);
      const third = formatDegreeMinute(val);
      expect(first).toBe(second);
      expect(second).toBe(third);
      expect(first).toBe("123°27′");
    });
  });
});
