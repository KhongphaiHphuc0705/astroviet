import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect } from 'vitest';

import { validateInterpretationContent } from '../../../../../../src/modules/chart/infrastructure/content/interpretation-content.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Real Interpretation Content File (O-M6-2)', () => {
  it('should be 100% valid, have 252 items, Published status, and vi language', () => {
    // Navigate from tests/unit/modules/chart/infrastructure/content to backend/prisma/content
    const contentPath = path.resolve(
      __dirname,
      '../../../../../../prisma/content/interpretations.vi.json',
    );
    expect(fs.existsSync(contentPath)).toBe(true);

    const rawData = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    const result = validateInterpretationContent(rawData);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);

    // Check coverage
    expect(result.coverage?.expected).toBe(252);
    expect(result.coverage?.present).toBe(252);
    expect(result.coverage?.missing).toEqual([]);
    expect(result.coverage?.unexpected).toEqual([]);

    // Check specific file metadata
    expect(result.file?.language).toBe('vi');
    expect(result.file?.status).toBe('Published');
    expect(result.file?.version).toBe('1.0');
    expect(result.file?.contentSource).toBe('Hybrid');

    // Ensure no placeholders exist
    const hasPlaceholder = result.file?.items.some(
      (item) => item.bodyText.includes('[OWNER_CONTENT_REQUIRED]') || item.bodyText.trim() === '',
    );
    expect(hasPlaceholder).toBe(false);
  });
});
