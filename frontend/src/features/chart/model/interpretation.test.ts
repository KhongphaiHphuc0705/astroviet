import { describe, expect, it } from "vitest";

import {
  buildAscendantInSignKey,
  buildInterpretationKeySpace,
  buildPlanetInHouseKey,
  buildPlanetInSignKey,
  getInterpretationItemId,
  HOUSE_NUMBERS,
  INTERPRETATION_PLANETS,
} from "./interpretation";

describe("interpretation model - key builders and key space", () => {
  it("U-01: builds valid keys for supported planet, sign, house, and angle", () => {
    expect(buildPlanetInSignKey("Sun", "Capricorn")).toBe("Sun_in_Capricorn");
    expect(buildPlanetInHouseKey("Sun", 7)).toBe("Sun_in_House_7");
    expect(buildAscendantInSignKey("Leo")).toBe("Ascendant_in_Leo");

    // Boundary checks for houses 1 and 12
    expect(buildPlanetInHouseKey("Moon", 1)).toBe("Moon_in_House_1");
    expect(buildPlanetInHouseKey("Pluto", 12)).toBe("Pluto_in_House_12");
    expect(INTERPRETATION_PLANETS).toHaveLength(10);
    expect(HOUSE_NUMBERS).toHaveLength(12);

    // getInterpretationItemId helper
    expect(getInterpretationItemId("Sun")).toBe("planet:Sun");
    expect(getInterpretationItemId("Ascendant")).toBe("angle:Ascendant");
    expect(getInterpretationItemId("Chiron")).toBeNull();
  });

  it("U-02: returns null for invalid, malformed, or prototype-polluting values", () => {
    // Unsupported / malformed planet names
    expect(buildPlanetInSignKey("Chiron", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("sun", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("SUN", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("toString", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("__proto__", "Aries")).toBeNull();
    expect(buildPlanetInSignKey(null, "Aries")).toBeNull();
    expect(buildPlanetInSignKey(undefined, "Aries")).toBeNull();
    expect(buildPlanetInSignKey(42, "Aries")).toBeNull();

    // Unsupported / malformed signs
    expect(buildPlanetInSignKey("Sun", "capricorn")).toBeNull();
    expect(buildPlanetInSignKey("Sun", "Capricorn ")).toBeNull();
    expect(buildPlanetInSignKey("Sun", "Ophiuchus")).toBeNull();
    expect(buildPlanetInSignKey("Sun", "toString")).toBeNull();
    expect(buildPlanetInSignKey("Sun", 7)).toBeNull();
    expect(buildPlanetInSignKey("Sun", null)).toBeNull();
    expect(buildPlanetInSignKey("Sun", undefined)).toBeNull();

    // Unsupported / malformed houses
    expect(buildPlanetInHouseKey("Sun", 0)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", 13)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", 7.5)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", "7")).toBeNull();
    expect(buildPlanetInHouseKey("Sun", NaN)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", -1)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", Infinity)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", null)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", undefined)).toBeNull();

    // Ascendant with malformed signs
    expect(buildAscendantInSignKey("leo")).toBeNull();
    expect(buildAscendantInSignKey("Leo ")).toBeNull();
    expect(buildAscendantInSignKey(null)).toBeNull();
    expect(buildAscendantInSignKey(undefined)).toBeNull();
    expect(buildAscendantInSignKey("toString")).toBeNull();
  });

  it("U-03: generates exact key space of 252 unique subjects with correct breakdown", () => {
    const keySpace = buildInterpretationKeySpace();

    expect(keySpace).toHaveLength(252);
    expect(Object.isFrozen(keySpace)).toBe(true);

    const planetInSign = keySpace.filter(
      (ref) => ref.subjectType === "PlanetInSign",
    );
    const angleInSign = keySpace.filter(
      (ref) => ref.subjectType === "AngleInSign",
    );
    const planetInHouse = keySpace.filter(
      (ref) => ref.subjectType === "PlanetInHouse",
    );

    expect(planetInSign).toHaveLength(120);
    expect(angleInSign).toHaveLength(12);
    expect(planetInHouse).toHaveLength(120);

    // Verify 100% uniqueness
    const uniqueKeys = new Set(
      keySpace.map((ref) => `${ref.subjectType}:${ref.subjectKey}`),
    );
    expect(uniqueKeys.size).toBe(252);

    // Verify all items are frozen
    for (const item of keySpace) {
      expect(Object.isFrozen(item)).toBe(true);
    }
  });
});
