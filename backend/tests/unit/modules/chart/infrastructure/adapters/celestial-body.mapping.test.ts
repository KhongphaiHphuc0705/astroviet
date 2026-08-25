import { describe, it, expect } from 'vitest';

import { PlanetName } from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { celestialBodyMapping } from '../../../../../../src/modules/chart/infrastructure/adapters/celestial-body.mapping.js';

describe('celestialBodyMapping', () => {
  it('should map all standard 10 planets correctly', () => {
    expect(celestialBodyMapping[PlanetName.Sun]).toBe(0);
    expect(celestialBodyMapping[PlanetName.Moon]).toBe(1);
    expect(celestialBodyMapping[PlanetName.Mercury]).toBe(2);
    expect(celestialBodyMapping[PlanetName.Venus]).toBe(3);
    expect(celestialBodyMapping[PlanetName.Mars]).toBe(4);
    expect(celestialBodyMapping[PlanetName.Jupiter]).toBe(5);
    expect(celestialBodyMapping[PlanetName.Saturn]).toBe(6);
    expect(celestialBodyMapping[PlanetName.Uranus]).toBe(7);
    expect(celestialBodyMapping[PlanetName.Neptune]).toBe(8);
    expect(celestialBodyMapping[PlanetName.Pluto]).toBe(9);
  });

  it('should map optional points correctly', () => {
    expect(celestialBodyMapping[PlanetName.NorthNode]).toBe(10); // SE_MEAN_NODE
    expect(celestialBodyMapping[PlanetName.Lilith]).toBe(12); // SE_MEAN_APOG
    expect(celestialBodyMapping[PlanetName.Chiron]).toBe(15); // SE_CHIRON
  });

  it('should not contain SouthNode mapping', () => {
    // SouthNode is intentionally excluded from the mapping as it is calculated mathematically
    expect(celestialBodyMapping).not.toHaveProperty(PlanetName.SouthNode);
  });

  it('should have exactly 13 mappings', () => {
    expect(Object.keys(celestialBodyMapping)).toHaveLength(13);
  });
});
