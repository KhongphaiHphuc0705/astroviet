import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InterpretationLookupService } from '../../../../../../src/modules/chart/application/services/interpretation-lookup.service.js';
import { Angle } from '../../../../../../src/modules/chart/domain/entities/angle.entity.js';
import { Planet } from '../../../../../../src/modules/chart/domain/entities/planet.entity.js';
import { InvalidInterpretationSubjectKeyError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { IInterpretationContentProvider } from '../../../../../../src/modules/chart/domain/ports/interpretation-content-provider.port.js';
import {
  PlanetCategory,
  PlanetName,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import {
  InterpretationContentRecord,
  InterpretationSubjectRef,
} from '../../../../../../src/modules/chart/domain/types/interpretation.types.js';
import { ZodiacPosition } from '../../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';
import { InfrastructureError } from '../../../../../../src/shared/errors/app-error.js';
import { ILogger } from '../../../../../../src/shared/logger/logger.interface.js';

function makePlanet(name: PlanetName, longitude: number, house: number | null = 1): Planet {
  return Planet.reconstitute({
    id: `planet-${name}`,
    name,
    category: PlanetCategory.Personal,
    longitude,
    latitude: 0,
    speed: 1,
    isRetrograde: false,
    zodiacPosition: ZodiacPosition.fromLongitude(longitude),
    house,
  });
}

function makeAngle(
  type: 'Ascendant' | 'Midheaven' | 'Descendant' | 'ImumCoeli',
  longitude: number,
): Angle {
  return Angle.reconstitute({ id: `angle-${type}`, type, longitude });
}

// Build all MVP Planets
function allMvpPlanets(houseOverride: number | null = 1): Planet[] {
  const planets = [
    PlanetName.Sun,
    PlanetName.Moon,
    PlanetName.Mercury,
    PlanetName.Venus,
    PlanetName.Mars,
    PlanetName.Jupiter,
    PlanetName.Saturn,
    PlanetName.Uranus,
    PlanetName.Neptune,
    PlanetName.Pluto,
  ];
  return planets.map((name, i) => makePlanet(name, i * 10, houseOverride));
}

// A full set of 4 angles (ASC at 0°, DSC at 180°, MC at 90°, IC at 270°)
function fullAngles(): Angle[] {
  return [
    makeAngle('Ascendant', 0),
    makeAngle('Descendant', 180),
    makeAngle('Midheaven', 90),
    makeAngle('ImumCoeli', 270),
  ];
}

// Minimal chart view: house data available + full planets + Ascendant
function makeFullChartView(snapshotInterpretationVersion: string | null = null) {
  return {
    id: 'chart-id-1',
    planets: allMvpPlanets(1),
    angles: fullAngles(),
    isHouseDataAvailable: true,
    snapshotInterpretationVersion,
  };
}

// A minimal InterpretationContentRecord for a subject
function makeRecord(
  subjectType: string,
  subjectKey: string,
  version = '1.0',
): InterpretationContentRecord {
  return {
    subjectType: subjectType as any,
    subjectKey,
    language: 'vi',
    tone: null,
    bodyText: `Body text for ${subjectKey}`,
    version,
    status: 'Published',
    contentSource: 'Hybrid',
  };
}

// Build a complete set of 21 records for a full chart (10 PlanetInSign + 1 Ascendant + 10 PlanetInHouse)
const CANONICAL_SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function signForLongitude(lon: number): string {
  return CANONICAL_SIGN_NAMES[Math.floor(lon / 30) % 12]!;
}

const MVP_PLANET_NAMES = [
  PlanetName.Sun,
  PlanetName.Moon,
  PlanetName.Mercury,
  PlanetName.Venus,
  PlanetName.Mars,
  PlanetName.Jupiter,
  PlanetName.Saturn,
  PlanetName.Uranus,
  PlanetName.Neptune,
  PlanetName.Pluto,
];

function makeAll21Records(version = '1.0'): InterpretationContentRecord[] {
  const records: InterpretationContentRecord[] = [];
  MVP_PLANET_NAMES.forEach((name, i) => {
    const sign = signForLongitude(i * 10);
    records.push(makeRecord('PlanetInSign', `${name}_in_${sign}`, version));
  });
  // Ascendant at 0° → Aries
  records.push(makeRecord('AngleInSign', 'Ascendant_in_Aries', version));
  MVP_PLANET_NAMES.forEach((name) => {
    records.push(makeRecord('PlanetInHouse', `${name}_in_House_1`, version));
  });
  return records;
}

//Tests
describe('InterpretationLookupService', () => {
  let mockProvider: IInterpretationContentProvider;
  let mockLogger: ILogger;
  let service: InterpretationLookupService;

  beforeEach(() => {
    mockProvider = {
      findPublishedVersions: vi.fn(),
      findPublishedContents: vi.fn(),
      insertMany: vi.fn(),
    } as unknown as IInterpretationContentProvider;

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    service = new InterpretationLookupService(mockProvider, mockLogger);
  });

  // ── resolveLatestVersion ─────────────────────────────────────────────────

  describe('resolveLatestVersion()', () => {
    it('should return null when provider returns no versions', async () => {
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue([]);
      const result = await service.resolveLatestVersion();
      expect(result).toBeNull();
      expect(mockProvider.findPublishedVersions).toHaveBeenCalledWith('vi');
    });

    it('should pick "2.0" from ["1.9", "1.10", "2.0"]', async () => {
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue(['1.9', '1.10', '2.0']);
      expect(await service.resolveLatestVersion()).toBe('2.0');
    });

    it('should pick "1.10" over "1.9"', async () => {
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue(['1.9', '1.10']);
      expect(await service.resolveLatestVersion()).toBe('1.10');
    });

    it('should skip invalid format strings and warn', async () => {
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue(['v1', '', '1.0']);
      const result = await service.resolveLatestVersion();
      expect(result).toBe('1.0');
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'interpretation.invalid_version_format',
        expect.objectContaining({ version: 'v1' }),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'interpretation.invalid_version_format',
        expect.objectContaining({ version: '' }),
      );
    });

    it('should return null when all versions are invalid', async () => {
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue(['v1', 'abc', '']);
      const result = await service.resolveLatestVersion();
      expect(result).toBeNull();
    });

    it('should break ties deterministically: "1.0" vs "1" — lexicographically larger wins', async () => {
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue(['1', '1.0']);
      const result = await service.resolveLatestVersion();
      // compareContentVersion returns 0 for ('1', '1.0'); lexicographic: '1.0' > '1'
      expect(result).toBe('1.0');
    });

    it('should propagate InfrastructureError from provider', async () => {
      const err = new InfrastructureError('DB error');
      vi.mocked(mockProvider.findPublishedVersions).mockRejectedValue(err);
      await expect(service.resolveLatestVersion()).rejects.toBe(err);
    });
  });

  // ── lookup() — no house data ────────────────────────────────────────────

  describe('lookup() — chart without house data', () => {
    it('should return only PlanetInSign subjects (no PlanetInHouse, no AngleInSign without Ascendant)', async () => {
      const chart = {
        id: 'chart-no-house',
        planets: allMvpPlanets(null),
        angles: [], // no angles → no Ascendant
        isHouseDataAvailable: false,
        snapshotInterpretationVersion: '1.0',
      };

      const planetInSignRecords = MVP_PLANET_NAMES.map((name, i) =>
        makeRecord('PlanetInSign', `${name}_in_${signForLongitude(i * 10)}`),
      );
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(planetInSignRecords);

      const result = await service.lookup(chart);
      expect(result.version).toBe('1.0');
      expect(result.items).toHaveLength(10);
      expect(result.items.every((r) => r.subjectType === 'PlanetInSign')).toBe(true);

      // Verify provider received only 10 PlanetInSign subjects
      const subjects: InterpretationSubjectRef[] = vi.mocked(mockProvider.findPublishedContents)
        .mock.calls[0][2] as any;
      expect(subjects.every((s) => s.subjectType === 'PlanetInSign')).toBe(true);
      expect(subjects).toHaveLength(10);
    });
  });

  // ── lookup() — pinned version ────────────────────────────────────────────

  describe('lookup() — pinned version', () => {
    it('should use pinned version and NOT call findPublishedVersions', async () => {
      const chart = makeFullChartView('1.0');
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(makeAll21Records('1.0'));

      await service.lookup(chart);

      expect(mockProvider.findPublishedVersions).not.toHaveBeenCalled();
      expect(mockProvider.findPublishedContents).toHaveBeenCalledWith(
        'vi',
        '1.0',
        expect.any(Array),
      );
    });

    it('should return { version: "1.0", items: [] } when pinned version has no content (version_unavailable warn)', async () => {
      const chart = makeFullChartView('1.0');
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue([]);

      const result = await service.lookup(chart);

      expect(result.version).toBe('1.0');
      expect(result.items).toHaveLength(0);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'interpretation.version_unavailable',
        expect.objectContaining({ chartId: 'chart-id-1', version: '1.0' }),
      );
    });

    it('should return correct 21 items for a fully-pinned chart, in canonical order', async () => {
      const chart = makeFullChartView('1.0');
      // Shuffle records to verify canonical ordering
      const shuffled = makeAll21Records('1.0').reverse();
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(shuffled);

      const result = await service.lookup(chart);

      expect(result.version).toBe('1.0');
      expect(result.items).toHaveLength(21);
      // First 10: PlanetInSign in canonical order
      expect(result.items[0]!.subjectType).toBe('PlanetInSign');
      expect(result.items[0]!.subjectKey).toBe('Sun_in_Aries');
      // Then Ascendant
      expect(result.items[10]!.subjectType).toBe('AngleInSign');
      expect(result.items[10]!.subjectKey).toBe('Ascendant_in_Aries');
      // Then PlanetInHouse
      expect(result.items[11]!.subjectType).toBe('PlanetInHouse');
    });
  });

  // ── lookup() — unpinned (null) version ─────────────────────────────────

  describe('lookup() — unpinned chart (null snapshot)', () => {
    it('should call resolveLatestVersion and use result', async () => {
      const chart = makeFullChartView(null); // unpinned
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue(['1.0']);
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(makeAll21Records('1.0'));

      const result = await service.lookup(chart);

      expect(mockProvider.findPublishedVersions).toHaveBeenCalledWith('vi');
      expect(mockProvider.findPublishedContents).toHaveBeenCalledWith(
        'vi',
        '1.0',
        expect.any(Array),
      );
      expect(result.version).toBe('1.0');
    });

    it('should return { version: null, items: [] } when no Published version exists', async () => {
      const chart = makeFullChartView(null);
      vi.mocked(mockProvider.findPublishedVersions).mockResolvedValue([]);

      const result = await service.lookup(chart);

      expect(result.version).toBeNull();
      expect(result.items).toHaveLength(0);
      expect(mockProvider.findPublishedContents).not.toHaveBeenCalled();
    });
  });

  // ── lookup() — partial content ───────────────────────────────────────────

  describe('lookup() — partial content (some subjects missing)', () => {
    it('should skip missing subjects, warn with missingCount, and return remaining items', async () => {
      const chart = makeFullChartView('1.0');
      const all21 = makeAll21Records('1.0');
      // Remove 3 records: first 3 PlanetInSign
      const partial = all21.slice(3);
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(partial);

      const result = await service.lookup(chart);

      expect(result.items).toHaveLength(18);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'interpretation.content_missing',
        expect.objectContaining({
          chartId: 'chart-id-1',
          version: '1.0',
          missingCount: 3,
        }),
      );
    });

    it('missingKeys should be capped at 20', async () => {
      // Build a chart where all 21 subjects are requested but only 0 returned
      const chart = makeFullChartView('1.0');
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue([]);

      await service.lookup(chart);

      const warnCall = vi
        .mocked(mockLogger.warn)
        .mock.calls.find((c) => c[0] === 'interpretation.content_missing');
      expect(warnCall).toBeDefined();
      const ctx = warnCall![1] as any;
      expect(ctx.missingKeys.length).toBeLessThanOrEqual(20);
    });
  });

  // ── lookup() — ordering ─────────────────────────────────────────────────

  describe('lookup() — result ordering', () => {
    it('should produce canonical order regardless of provider return order', async () => {
      const chart = makeFullChartView('1.0');
      const shuffled = makeAll21Records('1.0').sort(() => Math.random() - 0.5);
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(shuffled);

      const result = await service.lookup(chart);

      // Verify first is Sun_in_Aries (PlanetInSign) and 11th is AngleInSign
      expect(result.items[0]!.subjectType).toBe('PlanetInSign');
      expect(result.items[0]!.subjectKey).toBe('Sun_in_Aries');
      expect(result.items[10]!.subjectType).toBe('AngleInSign');
    });

    it('should ignore extra records not matching any subject', async () => {
      const chart = makeFullChartView('1.0');
      const records = makeAll21Records('1.0');
      // Add an extra record that doesn't match any subject
      records.push(makeRecord('PlanetInSign', 'Sun_in_Aquarius_EXTRA', '1.0'));
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(records);

      const result = await service.lookup(chart);

      expect(result.items).toHaveLength(21); // extra ignored
    });

    it('should pick first record on duplicate key (first-wins)', async () => {
      const chart = makeFullChartView('1.0');
      const records = makeAll21Records('1.0');
      // Duplicate Sun_in_Aries with different bodyText
      const duplicate = { ...records[0]!, bodyText: 'DUPLICATE TEXT' };
      records.push(duplicate);
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(records);

      const result = await service.lookup(chart);

      expect(result.items).toHaveLength(21);
      expect(result.items[0]!.bodyText).not.toBe('DUPLICATE TEXT');
    });
  });

  // ── lookup() — infrastructure errors ────────────────────────────────────

  describe('lookup() — infrastructure error propagation (R3)', () => {
    it('should propagate InfrastructureError from findPublishedVersions without swallowing', async () => {
      const chart = makeFullChartView(null); // unpinned → will call findPublishedVersions
      const err = new InfrastructureError('DB error on versions');
      vi.mocked(mockProvider.findPublishedVersions).mockRejectedValue(err);

      await expect(service.lookup(chart)).rejects.toBe(err);
    });

    it('should propagate InfrastructureError from findPublishedContents without swallowing', async () => {
      const chart = makeFullChartView('1.0');
      const err = new InfrastructureError('DB error on contents');
      vi.mocked(mockProvider.findPublishedContents).mockRejectedValue(err);

      await expect(service.lookup(chart)).rejects.toBe(err);
    });
  });

  // ── lookup() — corrupt chart data ───────────────────────────────────────

  describe('lookup() — corrupt chart data', () => {
    it('should propagate InvalidInterpretationSubjectKeyError when house number is invalid (e.g. 13)', async () => {
      const badPlanet = Planet.reconstitute({
        id: 'planet-sun-bad',
        name: PlanetName.Sun,
        category: PlanetCategory.Personal,
        longitude: 0,
        latitude: 0,
        speed: 1,
        isRetrograde: false,
        zodiacPosition: ZodiacPosition.fromLongitude(0),
        house: 13, // invalid house
      });

      const chart = {
        id: 'chart-corrupt',
        planets: [badPlanet, ...allMvpPlanets(1).slice(1)],
        angles: fullAngles(),
        isHouseDataAvailable: true,
        snapshotInterpretationVersion: '1.0',
      };

      // deriveInterpretationSubjects will throw InvalidInterpretationSubjectKeyError for house 13
      await expect(service.lookup(chart)).rejects.toThrow(InvalidInterpretationSubjectKeyError);
    });
  });

  // ── lookup() — input immutability ────────────────────────────────────────

  describe('lookup() — input immutability', () => {
    it('should not mutate the chart object', async () => {
      const chart = makeFullChartView('1.0');
      const originalId = chart.id;
      const originalVersion = chart.snapshotInterpretationVersion;
      vi.mocked(mockProvider.findPublishedContents).mockResolvedValue(makeAll21Records());

      await service.lookup(chart);

      expect(chart.id).toBe(originalId);
      expect(chart.snapshotInterpretationVersion).toBe(originalVersion);
    });
  });
});
