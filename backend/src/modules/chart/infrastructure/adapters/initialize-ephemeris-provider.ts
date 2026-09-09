import SwissEph from 'swisseph-wasm';

import { ExternalServiceError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

/**
 * Wraps the raw WASM initialization call and translates any failure into a
 * typed ExternalServiceError (Edge Case #11, #12 — §36 Swiss Ephemeris Integration Spec).
 *
 * Keeping this as a standalone exported function makes the fail-fast behavior
 * independently testable without bootstrapping the entire composition-root.
 */
export async function initializeEphemerisProvider(swe: SwissEph): Promise<void> {
  try {
    await swe.initSwissEph();
  } catch (error) {
    throw new ExternalServiceError(
      ErrorCode.EPHEMERIS_PROVIDER_ERROR,
      'Failed to initialize Swiss Ephemeris',
      undefined,
      error,
    );
  }
}
