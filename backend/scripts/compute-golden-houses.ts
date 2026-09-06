/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
/**
 * Bootstrap script: compute house cusps for 4 golden fixtures using
 * SwissEphemerisAdapter directly. Output is used to populate
 * expectedHouses/expectedAngles in fixture JSON files.
 *
 * Run: npx tsx scripts/compute-golden-houses.ts
 *
 * Source: Swiss Ephemeris WASM (same underlying engine as AstroViet)
 * Limitation: This is NOT an independent source — it validates that
 *   AstroViet calls Swiss Ephemeris with correct parameters (house system
 *   code, lat/lon order, UTC time), not that the algorithm is correct
 *   in absolute astronomical terms.
 */

import SwissEph from 'swisseph-wasm';

interface FixtureDef {
  fixtureId: string;
  utcDateTime: Date;
  latitude: number;
  longitude: number;
  houseSystem: string; // 'P' for Placidus, 'W' for WholeSign
  houseSystemName: string;
}

// 4 fixtures that have isBirthTimeKnown=true
const fixtures: FixtureDef[] = [
  {
    fixtureId: 'golden-001',
    // Hanoi 1990-06-15 12:00 Asia/Ho_Chi_Minh (UTC+7) = 1990-06-15 05:00 UTC
    utcDateTime: new Date('1990-06-15T05:00:00.000Z'),
    latitude: 21.0285,
    longitude: 105.8542,
    houseSystem: 'P',
    houseSystemName: 'Placidus',
  },
  {
    fixtureId: 'golden-002',
    // Sydney 2000-01-01 20:30 Australia/Sydney (AEDT UTC+11) = 2000-01-01 09:30 UTC
    utcDateTime: new Date('2000-01-01T09:30:00.000Z'),
    latitude: -33.8688,
    longitude: 151.2093,
    houseSystem: 'W',
    houseSystemName: 'WholeSign',
  },
  {
    fixtureId: 'golden-003',
    // London 2023-12-25 10:00 UTC (no conversion needed)
    utcDateTime: new Date('2023-12-25T10:00:00.000Z'),
    latitude: 51.5074,
    longitude: -0.1278,
    houseSystem: 'P',
    houseSystemName: 'Placidus',
  },
  {
    fixtureId: 'golden-005',
    // Paris 2022-07-15 15:00 Europe/Paris (CEST UTC+2) = 2022-07-15 13:00 UTC
    utcDateTime: new Date('2022-07-15T13:00:00.000Z'),
    latitude: 48.8566,
    longitude: 2.3522,
    houseSystem: 'W',
    houseSystemName: 'WholeSign',
  },
];

async function run() {
  const swe = new SwissEph();
  await swe.initSwissEph();
  console.log('Swiss Ephemeris WASM initialized\n');

  for (const fx of fixtures) {
    const julianDay = swe.julday(
      fx.utcDateTime.getUTCFullYear(),
      fx.utcDateTime.getUTCMonth() + 1,
      fx.utcDateTime.getUTCDate(),
      fx.utcDateTime.getUTCHours() +
        fx.utcDateTime.getUTCMinutes() / 60 +
        fx.utcDateTime.getUTCSeconds() / 3600,
    );

    const result = swe.houses(julianDay, fx.latitude, fx.longitude, fx.houseSystem);

    const cusps12 = Array.from(result.cusps).slice(1, 13);
    const ascendant = result.ascmc[0] as number;
    const midheaven = result.ascmc[1] as number;
    // DSC = ASC + 180 mod 360, IC = MC + 180 mod 360
    const dsc = (((ascendant + 180) % 360) + 360) % 360;
    const ic = (((midheaven + 180) % 360) + 360) % 360;

    // Per Domain Spec §16 (HouseCalculator line 32):
    // House 1 cusp = ascendant (not cusps[0]).
    // House 2 = cusps[1], House 3 = cusps[2], ..., House 12 = cusps[11].
    // cusps12[0] is house 2 cusp (since slice(1,13) gives Swiss Ephemeris cusps[1..12]).
    const houseMap = [
      { number: 1, cuspDegree: ascendant },
      ...Array.from({ length: 11 }, (_, k) => ({
        number: k + 2,
        cuspDegree: cusps12[k + 1],
      })),
    ];

    console.log(`=== ${fx.fixtureId} — ${fx.houseSystemName} ===`);
    console.log(`UTC: ${fx.utcDateTime.toISOString()}`);
    console.log(`Lat: ${fx.latitude}  Lon: ${fx.longitude}`);
    console.log('\n  expectedHouses:');
    houseMap.forEach(({ number, cuspDegree }) => {
      const normalized = ((cuspDegree % 360) + 360) % 360;
      console.log(`    { "number": ${number}, "cuspDegree": ${normalized.toFixed(7)} },`);
    });
    console.log('\n  expectedAngles:');
    console.log(`    { "type": "Ascendant",  "longitude": ${ascendant.toFixed(7)} },`);
    console.log(`    { "type": "Midheaven",  "longitude": ${midheaven.toFixed(7)} },`);
    console.log(`    { "type": "Descendant", "longitude": ${dsc.toFixed(7)} },`);
    console.log(`    { "type": "ImumCoeli",  "longitude": ${ic.toFixed(7)} }`);
    console.log('');
  }

  swe.close();
  console.log('Done. Copy the values above into the respective fixture JSON files.');
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
