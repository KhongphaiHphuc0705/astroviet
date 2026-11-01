/// <reference types="node" />

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { chartFull, chartNoHouses } from "../api/mocks/fixtures";
import {
  KNOWN_INTERPRETATION_SUBJECT_TYPES,
  KNOWN_PLANET_NAMES,
  KNOWN_ZODIAC_SIGNS,
} from "../api/types";

import {
  buildAscendantInSignKey,
  buildInterpretationKeySpace,
  buildPlanetInHouseKey,
  buildPlanetInSignKey,
  HOUSE_NUMBERS,
  INTERPRETATION_PLANETS,
} from "./interpretation";

interface ContentJsonItem {
  subjectType: string;
  subjectKey: string;
  bodyText: string;
}

interface ContentJsonFile {
  language: string;
  version: string;
  status: string;
  contentSource: string;
  items: ContentJsonItem[];
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const jsonPath = resolve(
  currentDir,
  "../../../../../backend/prisma/content/interpretations.vi.json",
);
const rawJsonText = readFileSync(jsonPath, "utf-8");
const jsonContent = JSON.parse(rawJsonText) as ContentJsonFile;

const modulePath = resolve(currentDir, "./interpretation.ts");
const moduleSource = readFileSync(modulePath, "utf-8");

describe("interpretation contract tests - backend content bank verification", () => {
  it("C-01: verifies top-level shape, metadata, and item contracts of interpretations.vi.json", () => {
    expect(jsonContent.language).toBe("vi");
    expect(jsonContent.version).toBe("1.0");
    expect(jsonContent.status).toBe("Published");
    expect(Array.isArray(jsonContent.items)).toBe(true);
    expect(jsonContent.items).toHaveLength(252);

    for (const item of jsonContent.items) {
      expect(
        KNOWN_INTERPRETATION_SUBJECT_TYPES,
        `Unexpected subjectType: ${item.subjectType}`,
      ).toContain(item.subjectType);

      expect(typeof item.subjectKey).toBe("string");
      expect(item.subjectKey.trim().length).toBeGreaterThan(0);

      expect(typeof item.bodyText).toBe("string");
      expect(item.bodyText.trim().length).toBeGreaterThan(0);

      // Verify each item has exactly 3 properties (no extra/leaked fields)
      const keys = Object.keys(item);
      expect(keys.sort()).toEqual(["bodyText", "subjectKey", "subjectType"]);
    }
  });

  it("C-02: counts raw attribute occurrences in JSON text to detect shadowed properties", () => {
    const subjectKeyMatches = rawJsonText.match(/"subjectKey"\s*:/g) ?? [];
    const subjectTypeMatches = rawJsonText.match(/"subjectType"\s*:/g) ?? [];
    const bodyTextMatches = rawJsonText.match(/"bodyText"\s*:/g) ?? [];

    expect(subjectKeyMatches).toHaveLength(252);
    expect(subjectTypeMatches).toHaveLength(252);
    expect(bodyTextMatches).toHaveLength(252);
  });

  it("C-03: verifies all 252 (subjectType, subjectKey) pairs in backend content are unique", () => {
    const uniqueKeys = new Set(
      jsonContent.items.map((item) => `${item.subjectType}:${item.subjectKey}`),
    );
    expect(uniqueKeys.size).toBe(252);
    expect(uniqueKeys.size).toBe(jsonContent.items.length);
  });

  it("C-04: verifies buildInterpretationKeySpace produces exactly 252 unique keys", () => {
    const keySpace = buildInterpretationKeySpace();
    expect(keySpace).toHaveLength(252);

    const uniqueSet = new Set(
      keySpace.map((ref) => `${ref.subjectType}:${ref.subjectKey}`),
    );
    expect(uniqueSet.size).toBe(252);
  });

  it("C-05: verifies exact bidirectional match between generated key space and backend JSON", () => {
    const keySpace = buildInterpretationKeySpace();
    const generatedMap = new Map(
      keySpace.map((ref) => [
        `${ref.subjectType}:${ref.subjectKey}`,
        ref.subjectType,
      ]),
    );
    const jsonMap = new Map(
      jsonContent.items.map((item) => [
        `${item.subjectType}:${item.subjectKey}`,
        item.subjectType,
      ]),
    );

    const missingInGenerated: string[] = [];
    for (const key of jsonMap.keys()) {
      if (!generatedMap.has(key)) {
        missingInGenerated.push(key);
      }
    }

    const unexpectedInGenerated: string[] = [];
    for (const key of generatedMap.keys()) {
      if (!jsonMap.has(key)) {
        unexpectedInGenerated.push(key);
      }
    }

    expect(
      missingInGenerated,
      "Keys present in JSON but missing in generated key space",
    ).toEqual([]);
    expect(
      unexpectedInGenerated,
      "Keys present in generated key space but missing in JSON",
    ).toEqual([]);

    // Breakdown counts
    const jsonPlanetInSign = jsonContent.items.filter(
      (item) => item.subjectType === "PlanetInSign",
    );
    const jsonAngleInSign = jsonContent.items.filter(
      (item) => item.subjectType === "AngleInSign",
    );
    const jsonPlanetInHouse = jsonContent.items.filter(
      (item) => item.subjectType === "PlanetInHouse",
    );

    expect(jsonPlanetInSign).toHaveLength(120);
    expect(jsonAngleInSign).toHaveLength(12);
    expect(jsonPlanetInHouse).toHaveLength(120);
  });

  it("C-06: locks standard identifiers against KNOWN_PLANET_NAMES, KNOWN_ZODIAC_SIGNS, and HOUSE_NUMBERS", () => {
    // 10 planets in INTERPRETATION_PLANETS must match the first 10 of KNOWN_PLANET_NAMES
    expect(INTERPRETATION_PLANETS).toEqual(KNOWN_PLANET_NAMES.slice(0, 10));

    // Signs extracted from JSON must match KNOWN_ZODIAC_SIGNS exactly
    const signsInJson = new Set<string>();
    for (const item of jsonContent.items) {
      if (item.subjectType === "PlanetInSign") {
        const parts = item.subjectKey.split("_in_");
        expect(parts).toHaveLength(2);
        signsInJson.add(parts[1]!);
      } else if (item.subjectType === "AngleInSign") {
        const parts = item.subjectKey.split("_in_");
        expect(parts).toHaveLength(2);
        signsInJson.add(parts[1]!);
      }
    }
    expect(Array.from(signsInJson).sort()).toEqual(
      Array.from(KNOWN_ZODIAC_SIGNS).sort(),
    );

    // Houses extracted from JSON must match HOUSE_NUMBERS exactly
    const housesInJson = new Set<number>();
    for (const item of jsonContent.items) {
      if (item.subjectType === "PlanetInHouse") {
        const match = item.subjectKey.match(/_in_House_(\d+)$/);
        expect(match).not.toBeNull();
        housesInJson.add(Number(match![1]));
      }
    }
    expect(Array.from(housesInJson).sort((a, b) => a - b)).toEqual(
      Array.from(HOUSE_NUMBERS),
    );
  });

  it("C-07: verifies every JSON item can be cleanly regenerated by public key builders", () => {
    for (const item of jsonContent.items) {
      if (item.subjectType === "PlanetInSign") {
        const [planet, sign] = item.subjectKey.split("_in_");
        expect(buildPlanetInSignKey(planet, sign)).toBe(item.subjectKey);
      } else if (item.subjectType === "AngleInSign") {
        const [, sign] = item.subjectKey.split("_in_");
        expect(buildAscendantInSignKey(sign)).toBe(item.subjectKey);
      } else if (item.subjectType === "PlanetInHouse") {
        const match = item.subjectKey.match(/^(.+)_in_House_(\d+)$/);
        expect(match).not.toBeNull();
        const planet = match![1];
        const house = Number(match![2]);
        expect(buildPlanetInHouseKey(planet, house)).toBe(item.subjectKey);
      }
    }
  });

  it("C-08: verifies all subjectKeys in captured fixtures chartFull and chartNoHouses belong to JSON key space", () => {
    const jsonKeySet = new Set(
      jsonContent.items.map((item) => `${item.subjectType}:${item.subjectKey}`),
    );

    // chartFull fixture: 21 items (10 PlanetInSign + 1 AngleInSign + 10 PlanetInHouse)
    expect(chartFull.interpretations).toHaveLength(21);
    for (const interp of chartFull.interpretations) {
      expect(
        jsonKeySet.has(`${interp.subjectType}:${interp.subjectKey}`),
        `chartFull key not found in backend JSON: ${interp.subjectKey}`,
      ).toBe(true);
    }

    // chartNoHouses fixture: 10 items (all 10 are PlanetInSign)
    expect(chartNoHouses.interpretations).toHaveLength(10);
    for (const interp of chartNoHouses.interpretations) {
      expect(
        jsonKeySet.has(`${interp.subjectType}:${interp.subjectKey}`),
        `chartNoHouses key not found in backend JSON: ${interp.subjectKey}`,
      ).toBe(true);
    }
  });
});

describe("interpretation purity & architecture tests (P-01..P-03)", () => {
  it("P-01: verifies allowlist imports in interpretation.ts", () => {
    const importRegex =
      /import\s+(?:type\s+)?[\s\S]*?from\s+["']([^"']+)["'];?/g;
    const matches = Array.from(moduleSource.matchAll(importRegex));

    expect(matches.length).toBeGreaterThan(0);

    for (const match of matches) {
      const fullStatement = match[0];
      const importPath = match[1];

      expect(
        ["../api/types", "./chartViewModel"].includes(importPath!),
        `Disallowed import path in interpretation.ts: ${importPath}`,
      ).toBe(true);

      if (importPath === "./chartViewModel") {
        expect(
          fullStatement.startsWith("import type"),
          `Imports from ./chartViewModel must be type-only: ${fullStatement}`,
        ).toBe(true);
      }
    }
  });

  it("P-02: verifies environmental purity (no react, DOM, window, localStorage, fetch, Date, Math.random, console)", () => {
    const forbiddenIdentifiers = [
      "react",
      "document",
      "window",
      "localStorage",
      "fetch",
      "Math.random",
      "Date",
      "console",
    ];

    for (const word of forbiddenIdentifiers) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      expect(
        regex.test(moduleSource),
        `Forbidden environment identifier "${word}" found in interpretation.ts`,
      ).toBe(false);
    }
  });

  it("P-03: verifies 100% ASCII source text and absence of dangerouslySetInnerHTML", () => {
    expect(moduleSource).not.toContain("dangerouslySetInnerHTML");

    for (let i = 0; i < moduleSource.length; i++) {
      const code = moduleSource.charCodeAt(i);
      expect(
        code <= 127,
        `Non-ASCII character found at index ${i}: code point ${code} (${moduleSource[i]})`,
      ).toBe(true);
    }
  });
});
