import { fileURLToPath } from 'url';

import { defineConfig } from 'vitest/config';

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-must-be-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-must-be-32-chars';
process.env.GEONAMES_USERNAME = 'test_user';
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    testTimeout: 10000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/types/**',
        'src/**/index.ts',
        'src/server.ts',
        'src/app.ts',
        'src/shared/constants/**',
        'src/shared/errors/error-metadata.ts',
        'src/shared/logger/logger.interface.ts',
        'src/shared/utils/type.utils.ts',
      ],
      // Coverage threshold toàn cục đã bị loại bỏ theo Sprint 3 Backend Plan §12.7
      // (CONFIRMED, risk-based policy — không dùng % làm Acceptance Criterion).
      // Report vẫn được sinh ra (text/json/html) để làm công cụ chẩn đoán,
      // nhưng KHÔNG làm fail CI dựa trên %.
    },
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
