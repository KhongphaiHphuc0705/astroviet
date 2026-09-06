import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Schema for a single expected planet entry in a Golden Fixture.
 * Only physical bodies (Sun→Pluto, Chiron) are validated against NASA JPL Horizons.
 * NorthNode, SouthNode, Lilith are omitted from planet-level validation
 * (they are mathematical/computed points, not physical bodies — not available in JPL Horizons).
 */
export interface GoldenPlanetExpectation {
  name: string;
  longitude: number;
  isRetrograde: boolean;
  retrogradeNote?: string;
  jplDelta?: number;
}

export interface GoldenHouseExpectation {
  number: number;
  cuspDegree: number;
}

export interface GoldenAngleExpectation {
  type: string;
  longitude: number;
}

/**
 * Schema for a Golden Chart Fixture file (tests/fixtures/golden/*.json).
 * See tests/fixtures/golden/README.md for provenance details.
 */
export interface GoldenFixture {
  fixtureId: string;
  description: string;
  birthData: {
    birthDate: string; // YYYY-MM-DD
    birthTime: { hour: number; minute: number; second: number } | null;
    isBirthTimeKnown: boolean;
    timezoneId: string;
    latitude: number;
    longitude: number;
  };
  houseSystem: 'Placidus' | 'WholeSign';
  includeOptionalPoints: string[];
  reference: {
    planetSource: string;
    planetSourceUrl: string;
    planetSourceRetrievedAt: string;
    planetSourceEphemeris?: string;
    utcQueryTime?: string;
    houseSource: string | null;
    houseSourceUrl: string | null;
    houseSourceRetrievedAt: string | null;
    houseSourceLimitation: string | null;
  };
  expectedPlanets: GoldenPlanetExpectation[];
  expectedHouses: GoldenHouseExpectation[] | null;
  expectedAngles: GoldenAngleExpectation[] | null;
  tolerance: number;
  notes: string;
}

/**
 * Loads all Golden Fixture JSON files from the fixtures/golden directory.
 * Files are sorted by name (fixture-001.json, fixture-002.json, ...) to ensure
 * deterministic order across platforms.
 */
export function loadGoldenFixtures(): GoldenFixture[] {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const goldenDir = path.resolve(__dirname, '../../fixtures/golden');

  const files = fs
    .readdirSync(goldenDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const fullPath = path.join(goldenDir, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(raw) as GoldenFixture;
  });
}
