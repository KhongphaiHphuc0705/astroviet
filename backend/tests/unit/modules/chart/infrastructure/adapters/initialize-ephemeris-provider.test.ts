import SwissEph from 'swisseph-wasm';
import { describe, it, expect, vi } from 'vitest';

import { initializeEphemerisProvider } from '../../../../../../src/modules/chart/infrastructure/adapters/initialize-ephemeris-provider.js';
import { ExternalServiceError } from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('Ephemeris Provider bootstrap boundary (Edge Case #11, #12)', () => {
  it('translates a raw initSwissEph() failure into ExternalServiceError(EPHEMERIS_PROVIDER_ERROR) — fail-fast', async () => {
    const brokenSwe = {
      initSwissEph: vi.fn().mockRejectedValue(new Error('corrupt ephemeris data')),
    } as unknown as SwissEph;

    await expect(initializeEphemerisProvider(brokenSwe)).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof ExternalServiceError && err.errorCode === ErrorCode.EPHEMERIS_PROVIDER_ERROR,
    );
  });

  it('resolves without error when initSwissEph() succeeds', async () => {
    const healthySwe = {
      initSwissEph: vi.fn().mockResolvedValue(undefined),
    } as unknown as SwissEph;

    await expect(initializeEphemerisProvider(healthySwe)).resolves.toBeUndefined();
  });
});
