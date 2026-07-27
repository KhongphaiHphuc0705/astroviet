import { describe, it, expect } from 'vitest';

import { searchLocationsQuerySchema } from '../../../../../../src/modules/birth-profile/presentation/schemas/location-search.schema.js';

describe('SearchLocationsQuerySchema', () => {
  it('should validate a valid query', () => {
    const data = { q: 'Hanoi', date: '2000-01-01' };
    const result = searchLocationsQuerySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject a query that is too short', () => {
    const data = { q: 'a', date: '2000-01-01' };
    const result = searchLocationsQuerySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Query must be at least 2 characters long');
    }
  });

  it('should reject a query that is too long', () => {
    const data = { q: 'a'.repeat(101), date: '2000-01-01' };
    const result = searchLocationsQuerySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Query must not exceed 100 characters');
    }
  });

  it('should reject a query with missing date', () => {
    const data = { q: 'Hanoi' };
    const result = searchLocationsQuerySchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject a query with invalid date format', () => {
    const data = { q: 'Hanoi', date: 'invalid-date' };
    const result = searchLocationsQuerySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date must be in YYYY-MM-DD format');
    }
  });
});
