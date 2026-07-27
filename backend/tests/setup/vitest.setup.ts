import { afterAll, beforeAll } from 'vitest';

import '../../src/docs/openapi.js';

// Global beforeAll
beforeAll(() => {
  // Set required test env vars
  process.env.GEONAMES_USERNAME = 'test_user';
  // Global mocks or environment initialization if needed
  // Note: We don't mock business modules here.
});

// Global afterAll
afterAll(() => {
  // Global cleanup (e.g. closing database connections if opened globally for tests)
});

// Add custom matchers if needed in the future
