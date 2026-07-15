import { fileURLToPath } from 'url';

import { defineConfig } from 'vitest/config';

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test';
process.env.LOG_LEVEL = 'silent';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    testTimeout: 10000,
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
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        // Chú ý: Ở Sprint 0-4, ta áp dụng 80% cho Application (health, etc).
        // Sau này sẽ config overrides cho 'src/modules/*/domain/**' là 90%.
      },
    },
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
