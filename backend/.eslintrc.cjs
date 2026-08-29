/**
 * ESLint config — AstroViet Backend
 * Nguồn quy tắc: Coding Standards & Conventions Mục 23, Backend Implementation Guide Mục 4.
 *
 * Lưu ý: `boundaries/element-types` chỉ có ý nghĩa đầy đủ khi `src/modules/*` có cấu trúc
 * `domain|application|infrastructure|presentation`. Ở Sprint 0, `src/modules/` còn trống —
 * rule vẫn được bật ngay từ bây giờ để mọi module thêm sau tự động bị enforce, không cần
 * "nhớ" bật lại sau này.
 *
 * Cross-module boundary (T-BOUNDARY-VERIFY, Sprint 3 M4): chỉ dùng `boundaries/dependencies`
 * (kết hợp `boundaries/elements` + `boundaries/files`) — KHÔNG dùng `boundaries/entry-point`,
 * vì rule đó đã bị `eslint-plugin-boundaries@7.2.0` đánh dấu deprecated, khuyến nghị migrate
 * chính vào `boundaries/dependencies` (xem policy #2 bên dưới).
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.eslint.json',
  },
  plugins: ['@typescript-eslint', 'import', 'boundaries'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: { alwaysTryTypes: true },
      node: { extensions: ['.ts', '.js'] },
    },
    'boundaries/elements': [
      { type: 'shared', pattern: 'src/shared/**' },
      { type: 'config', pattern: 'src/config/**' },
      { type: 'health', pattern: 'src/health/**' },
      { type: 'domain', pattern: 'src/modules/*/domain/**', capture: ['moduleName'] },
      { type: 'application', pattern: 'src/modules/*/application/**', capture: ['moduleName'] },
      {
        type: 'infrastructure',
        pattern: 'src/modules/*/infrastructure/**',
        capture: ['moduleName'],
      },
      { type: 'presentation', pattern: 'src/modules/*/presentation/**', capture: ['moduleName'] },
      { type: 'module-internal', pattern: 'src/modules/*/**', capture: ['moduleName'] },
    ],
    'boundaries/files': [
      {
        category: 'module-root',
        pattern: 'src/modules/*/index.ts',
        capture: ['moduleName'],
        stopMatching: true,
      },
      { category: 'module-internal-file', pattern: 'src/modules/*/**', capture: ['moduleName'] },
    ],
  },
  rules: {
    // --- TypeScript strictness (Coding Standards Mục 1) ---
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // --- General (Coding Standards Mục 20, 23) ---
    'no-console': 'error', // chỉ dùng Pino — xem shared/logger
    eqeqeq: ['error', 'always'],

    // --- Import Order (Coding Standards Mục 15) ---
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // --- Dependency Rules / Clean Architecture boundaries ---
    // (Backend Implementation Guide Mục 4 — Domain layer TUYỆT ĐỐI không phụ thuộc
    //  Application/Infrastructure/Presentation; Application không phụ thuộc Infrastructure/Presentation)
    'boundaries/dependencies': [
      'error',
      {
        default: 'allow',
        policies: [
          // 1. Layer Dependencies Rules
          {
            from: { element: { type: 'domain' } },
            disallow: [
              { to: { element: { type: 'application' } } },
              { to: { element: { type: 'infrastructure' } } },
              { to: { element: { type: 'presentation' } } },
            ],
            message:
              'Domain Layer không được phụ thuộc Application/Infrastructure/Presentation (Project Architecture Spec Mục 6).',
          },
          {
            from: { element: { type: 'application' } },
            disallow: [
              { to: { element: { type: 'infrastructure' } } },
              { to: { element: { type: 'presentation' } } },
            ],
            message:
              'Application Layer không được phụ thuộc Infrastructure/Presentation (chỉ phụ thuộc Domain interface).',
          },
          {
            from: { element: { type: 'infrastructure' } },
            disallow: [{ to: { element: { type: 'presentation' } } }],
            message: 'Infrastructure Layer không được phụ thuộc Presentation.',
          },
          // 2. Cross-Module Entry Point Rule
          {
            from: {
              element: {
                type: [
                  'domain',
                  'application',
                  'infrastructure',
                  'presentation',
                  'module-internal',
                  'module-root',
                ],
              },
            },
            disallow: [
              {
                to: {
                  element: {
                    type: [
                      'domain',
                      'application',
                      'infrastructure',
                      'presentation',
                      'module-internal',
                    ],
                    captured: { moduleName: '!{{ from.moduleName }}' }, // ← chặn nếu khác module
                  },
                  file: { categories: 'module-internal-file' }, // ← chỉ áp dụng cho file KHÔNG phải module-root
                },
              },
            ],
            message:
              'Cross-module imports must go through the module-root (index.ts). Do not import internal files of other modules.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Test file: cho phép any/console tùy tình huống mock, không siết quá chặt
      files: ['**/*.test.ts', 'tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['src/shared/logger/**'],
      rules: {
        'no-console': 'off', // setup logger là nơi hợp lệ duy nhất chạm console nếu cần fallback
      },
    },
    {
      // `boundaries/element-types` chỉ enforce quan hệ GIỮA các internal element (Mục trên) —
      // không tự chặn được package NGOÀI (vd '@prisma/client', 'express'). Bổ sung
      // `no-restricted-imports` để Domain Layer không thể import trực tiếp Infrastructure SDK,
      // đúng Backend Implementation Guide Mục 4 / Coding Standards Mục 1.
      files: ['src/modules/*/domain/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@prisma/client',
                message:
                  'Domain Layer không được import Prisma trực tiếp — định nghĩa Port ở domain/ports/, implement ở infrastructure/.',
              },
              {
                name: 'express',
                message:
                  'Domain Layer không được biết Express tồn tại (Project Architecture Spec Mục 4).',
              },
            ],
          },
        ],
      },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', 'docs/openapi/*.json'],
};
