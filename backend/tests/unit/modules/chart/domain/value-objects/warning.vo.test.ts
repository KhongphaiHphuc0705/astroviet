import { describe, it, expect } from 'vitest';

import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  Warning,
  WarningSeverity,
} from '../../../../../../src/modules/chart/domain/value-objects/warning.vo.js';

describe('Warning VO', () => {
  it('should create correctly with info severity', () => {
    const warning = Warning.create({
      code: 'WARN_001',
      message: 'Some info',
      severity: 'info',
    });

    expect(warning.code).toBe('WARN_001');
    expect(warning.message).toBe('Some info');
    expect(warning.severity).toBe('info');
    expect(warning.field).toBeUndefined();
    expect(warning.details).toBeUndefined();
  });

  it('should create correctly with warning severity and optional fields', () => {
    const warning = Warning.create({
      code: 'WARN_002',
      message: 'Some warning',
      severity: 'warning',
      field: 'latitude',
      details: { extra: 123 },
    });

    expect(warning.severity).toBe('warning');
    expect(warning.field).toBe('latitude');
    expect(warning.details).toEqual({ extra: 123 });
  });

  it('should throw DataIntegrityError if severity is invalid', () => {
    expect(() => {
      Warning.create({
        code: 'WARN_003',
        message: 'Invalid severity',
        severity: 'error' as WarningSeverity, // force invalid type
      });
    }).toThrow(DataIntegrityError);
  });
});
