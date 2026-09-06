import SwissEph from 'swisseph-wasm';
import { beforeAll, describe, expect, it } from 'vitest';

import { ChartBuilder } from '../../src/modules/chart/domain/engine/chart-builder.js';
import {
  ChartType,
  HouseSystem,
  PlanetName,
} from '../../src/modules/chart/domain/types/chart.types.js';
import { EngineInput } from '../../src/modules/chart/domain/value-objects/engine-input.vo.js';
import { SwissEphemerisAdapter } from '../../src/modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.js';

import { assertAngleWithinTolerance } from './helpers/assert-angle-tolerance.js';
import { GoldenFixture, loadGoldenFixtures } from './helpers/load-golden-fixtures.js';

// ---------------------------------------------------------------------------
// Test Setup — Swiss Ephemeris WASM (real, not mocked)
// ---------------------------------------------------------------------------

let chartBuilder: ChartBuilder;

beforeAll(async () => {
  const swissEph = new SwissEph();
  await swissEph.initSwissEph();
  const adapter = new SwissEphemerisAdapter(swissEph);
  chartBuilder = new ChartBuilder(adapter);
});

// ---------------------------------------------------------------------------
// Helper: Build EngineInput from a Golden Fixture
// ---------------------------------------------------------------------------

function buildEngineInput(fixture: GoldenFixture): EngineInput {
  return EngineInput.create(
    {
      fullName: null,
      placeName: fixture.description,
      birthDate: new Date(`${fixture.birthData.birthDate}T00:00:00.000Z`),
      birthTime: fixture.birthData.birthTime,
      isBirthTimeKnown: fixture.birthData.isBirthTimeKnown,
      latitude: fixture.birthData.latitude,
      longitude: fixture.birthData.longitude,
      timezoneId: fixture.birthData.timezoneId,
    },
    {
      chartType: ChartType.Natal,
      houseSystem: fixture.houseSystem as HouseSystem,
      // Include Chiron — it has independent JPL Horizons reference data (asteroid 2060 Chiron)
      // NorthNode, SouthNode, Lilith are not included: no independent source from JPL Horizons
      includeOptionalPoints: [PlanetName.Chiron],
    },
  );
}

// ---------------------------------------------------------------------------
// Golden Reference Tests — one describe block per fixture
// ---------------------------------------------------------------------------

const fixtures = loadGoldenFixtures();

describe('Golden Reference Tests — Astrology Engine', () => {
  expect(fixtures.length).toBeGreaterThanOrEqual(5);

  for (const fixture of fixtures) {
    describe(`[${fixture.fixtureId}] ${fixture.description}`, () => {
      // Build the chart once per fixture (shared across its `it` blocks)
      let chart: Awaited<ReturnType<ChartBuilder['build']>>;

      beforeAll(async () => {
        chart = await chartBuilder.build({
          id: fixture.fixtureId,
          userId: null,
          birthProfileId: null,
          engineInput: buildEngineInput(fixture),
        });
      });

      // -----------------------------------------------------------------------
      // Test 1: Planet Longitudes
      // -----------------------------------------------------------------------

      it('planet longitudes match NASA JPL Horizons DE441 within 0.01° tolerance', () => {
        for (const expectedPlanet of fixture.expectedPlanets) {
          const actualPlanet = chart.planets.find((p) => p.name === expectedPlanet.name);

          expect(
            actualPlanet,
            `Planet "${expectedPlanet.name}" not found in chart output`,
          ).toBeDefined();

          assertAngleWithinTolerance(
            actualPlanet!.longitude,
            expectedPlanet.longitude,
            fixture.tolerance,
            {
              fixtureId: fixture.fixtureId,
              field: `planet.${expectedPlanet.name}.longitude`,
            },
          );
        }
      });

      // -----------------------------------------------------------------------
      // Test 2: Retrograde Status
      // -----------------------------------------------------------------------

      it('retrograde status matches NASA JPL Horizons velocity direction', () => {
        for (const expectedPlanet of fixture.expectedPlanets) {
          const actualPlanet = chart.planets.find((p) => p.name === expectedPlanet.name);

          expect(
            actualPlanet,
            `Planet "${expectedPlanet.name}" not found in chart output`,
          ).toBeDefined();

          expect(
            actualPlanet!.isRetrograde,
            `planet.${expectedPlanet.name}.isRetrograde` +
              (expectedPlanet.retrogradeNote
                ? ` — JPL note: ${expectedPlanet.retrogradeNote}`
                : ''),
          ).toBe(expectedPlanet.isRetrograde);
        }
      });

      // -----------------------------------------------------------------------
      // Test 3: House Cusps (only if fixture has expectedHouses, i.e. known time)
      // Validates parameter passing into Swiss Ephemeris (house system, lat/lon).
      // Note: expected values are from Swiss Ephemeris itself — verifies correct call,
      // not astronomical accuracy (no independent house calculator exists).
      // -----------------------------------------------------------------------

      it('houses are absent for unknown birth time (D-9)', () => {
        if (!fixture.birthData.isBirthTimeKnown) {
          // Domain Rule D-9: unknown birth time => no house data
          expect(chart.houses).toHaveLength(0);
          expect(chart.angles).toHaveLength(0);
        }
      });

      it('house cusps match expected values when birth time is known', () => {
        if (!fixture.expectedHouses || !fixture.birthData.isBirthTimeKnown) {
          // No house expectations for this fixture — skip without failure
          return;
        }

        expect(chart.houses.length).toBe(12);

        for (const expectedHouse of fixture.expectedHouses) {
          const actualHouse = chart.houses.find((h) => h.number === expectedHouse.number);

          expect(actualHouse, `House ${expectedHouse.number} not found`).toBeDefined();

          assertAngleWithinTolerance(
            actualHouse!.cuspDegree,
            expectedHouse.cuspDegree,
            fixture.tolerance,
            {
              fixtureId: fixture.fixtureId,
              field: `house.${expectedHouse.number}.cuspDegree`,
            },
          );
        }
      });

      // -----------------------------------------------------------------------
      // Test 4: Angles (Ascendant, Midheaven, etc.)
      // Same limitation as houses — values from Swiss Ephemeris itself.
      // -----------------------------------------------------------------------

      it('angles match expected values when birth time is known', () => {
        if (!fixture.expectedAngles || !fixture.birthData.isBirthTimeKnown) {
          return;
        }

        for (const expectedAngle of fixture.expectedAngles) {
          const actualAngle = chart.angles.find((a) => a.type === expectedAngle.type);

          expect(actualAngle, `Angle "${expectedAngle.type}" not found`).toBeDefined();

          assertAngleWithinTolerance(
            actualAngle!.longitude,
            expectedAngle.longitude,
            fixture.tolerance,
            {
              fixtureId: fixture.fixtureId,
              field: `angle.${expectedAngle.type}.longitude`,
            },
          );
        }
      });
    });
  }
});
