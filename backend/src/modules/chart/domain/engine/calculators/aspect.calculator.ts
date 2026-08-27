import { randomUUID } from 'node:crypto';

import { Aspect } from '../../entities/aspect.entity.js';
import { Planet } from '../../entities/planet.entity.js';
import { AspectType, PlanetName } from '../../types/chart.types.js';

// Internal type for orb policy. NOT part of the Domain Model (PlanetCategory).
type OrbGroup = 'Personal' | 'NonPersonal';

function toOrbGroup(name: PlanetName): OrbGroup {
  const PERSONAL: PlanetName[] = [
    PlanetName.Sun,
    PlanetName.Moon,
    PlanetName.Mercury,
    PlanetName.Venus,
    PlanetName.Mars,
  ];
  return PERSONAL.includes(name) ? 'Personal' : 'NonPersonal';
}

const ORB_TABLE: Record<AspectType, { Personal: number; NonPersonal: number }> = {
  [AspectType.Conjunction]: { Personal: 8, NonPersonal: 6 },
  [AspectType.Sextile]: { Personal: 4, NonPersonal: 3 },
  [AspectType.Square]: { Personal: 7, NonPersonal: 5 },
  [AspectType.Trine]: { Personal: 7, NonPersonal: 5 },
  [AspectType.Opposition]: { Personal: 8, NonPersonal: 6 },
};

const ASPECT_ANGLES: Record<AspectType, number> = {
  [AspectType.Conjunction]: 0,
  [AspectType.Sextile]: 60,
  [AspectType.Square]: 90,
  [AspectType.Trine]: 120,
  [AspectType.Opposition]: 180,
};

export class AspectCalculator {
  /**
   * Calculates aspects between all unique pairs of planets (O(N^2) combination).
   */
  public static calculate(planets: Planet[]): Aspect[] {
    const aspects: Aspect[] = [];
    const n = planets.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let p1 = planets[i];
        let p2 = planets[j];

        if (!p1 || !p2) continue;

        // Canonical ordering (alphabetical)
        if (p1.name > p2.name) {
          const temp = p1;
          p1 = p2;
          p2 = temp;
        }

        const angularSeparation = this.calculateAngularSeparation(p1.longitude, p2.longitude);

        // Determine maximum allowed orb by taking the widest group of the two planets
        const group1 = toOrbGroup(p1.name);
        const group2 = toOrbGroup(p2.name);
        const isPersonal = group1 === 'Personal' || group2 === 'Personal';

        for (const [aspectType, idealAngle] of Object.entries(ASPECT_ANGLES) as [
          AspectType,
          number,
        ][]) {
          const orb = Math.abs(angularSeparation - idealAngle);

          const maxOrbAllowed = isPersonal
            ? ORB_TABLE[aspectType].Personal
            : ORB_TABLE[aspectType].NonPersonal;

          if (orb <= maxOrbAllowed) {
            const isApplying = this.calculateIsApplying(p1, p2, angularSeparation);

            aspects.push(
              Aspect.create({
                id: randomUUID(),
                planetA: p1.name,
                planetB: p2.name,
                aspectType,
                exactAngle: angularSeparation,
                orb,
                isApplying,
              }),
            );

            // Only one aspect can physically match given the >30deg gap between ideal angles
            // and the maximum orb of 8deg.
            break;
          }
        }
      }
    }

    return aspects;
  }

  /**
   * Calculates the shortest angular distance between two longitudes on a 360-degree circle.
   * Result is always in [0, 180].
   */
  private static calculateAngularSeparation(lon1: number, lon2: number): number {
    let rawDiff = Math.abs(lon1 - lon2);
    rawDiff = ((rawDiff % 360) + 360) % 360; // Normalize just in case
    return Math.min(rawDiff, 360 - rawDiff);
  }

  /**
   * Determines if the aspect is applying (getting closer to exactness) or separating.
   */
  private static calculateIsApplying(p1: Planet, p2: Planet, currentSeparation: number): boolean {
    // Domain Spec §18.3: Δt is a small, fixed constant (e.g., 1 hour) to approximate instantaneous derivative.
    // Assuming speed is in degrees/day (standard for Swiss Ephemeris), 1 hour = 1/24 day.
    const dt = 1 / 24;
    const l1_next = p1.longitude + p1.speed * dt;
    const l2_next = p2.longitude + p2.speed * dt;

    const nextSeparation = this.calculateAngularSeparation(l1_next, l2_next);

    return nextSeparation < currentSeparation;
  }
}
