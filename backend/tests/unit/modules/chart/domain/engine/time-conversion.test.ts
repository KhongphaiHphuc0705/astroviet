import { describe, it, expect } from 'vitest';

import {
  ANCHOR_TIME_FOR_UNKNOWN_BIRTH_TIME,
  convertLocalTimeToUtc,
} from '../../../../../../src/modules/chart/domain/engine/time-conversion.js';
import { UnresolvableTimezoneError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';

describe('time-conversion', () => {
  describe('convertLocalTimeToUtc', () => {
    it('should correctly convert local time to UTC (standard case)', () => {
      // 1990-05-15 14:30:00 in America/New_York (EDT -> UTC-4)
      const localDate = new Date('1990-05-15T00:00:00.000Z');
      const localTime = { hour: 14, minute: 30, second: 0 };

      const utcDate = convertLocalTimeToUtc(localDate, localTime, true, 'America/New_York');

      // EDT is UTC-4, so 14:30 EDT is 18:30 UTC
      expect(utcDate.toISOString()).toBe('1990-05-15T18:30:00.000Z');
    });

    it('should use anchor time when isBirthTimeKnown is false', () => {
      const localDate = new Date('1990-05-15T00:00:00.000Z');

      const utcDate = convertLocalTimeToUtc(localDate, null, false, 'America/New_York');

      // Anchor time is 12:00:00 local. In EDT (UTC-4), 12:00 EDT is 16:00 UTC.
      expect(utcDate.toISOString()).toBe('1990-05-15T16:00:00.000Z');
      expect(ANCHOR_TIME_FOR_UNKNOWN_BIRTH_TIME.hour).toBe(12);
    });

    it('should throw UnresolvableTimezoneError for invalid timezoneId', () => {
      const localDate = new Date('1990-05-15T00:00:00.000Z');
      const localTime = { hour: 14, minute: 30, second: 0 };

      expect(() =>
        convertLocalTimeToUtc(localDate, localTime, true, 'Invalid/Timezone'),
      ).toThrowError(UnresolvableTimezoneError);
    });

    describe('Historical Vietnam Timezone correctness', () => {
      // Testing historical offsets for Asia/Ho_Chi_Minh based on IANA TZDB

      it('should handle pre-1911 offset (+07:06:30 LMT/SMT)', () => {
        // 1910-01-01 12:00:00 local
        const localDate = new Date('1910-01-01T00:00:00.000Z');
        const localTime = { hour: 12, minute: 0, second: 0 };

        const utcDate = convertLocalTimeToUtc(localDate, localTime, true, 'Asia/Ho_Chi_Minh');

        // 12:00 - 07:06:30 = 04:53:30 UTC
        expect(utcDate.toISOString()).toBe('1910-01-01T04:53:30.000Z');
      });

      it('should handle 1943-1945 offset (+08:00)', () => {
        // 1944-01-01 12:00:00 local
        const localDate = new Date('1944-01-01T00:00:00.000Z');
        const localTime = { hour: 12, minute: 0, second: 0 };

        const utcDate = convertLocalTimeToUtc(localDate, localTime, true, 'Asia/Ho_Chi_Minh');

        // 12:00 - 08:00 = 04:00 UTC
        expect(utcDate.toISOString()).toBe('1944-01-01T04:00:00.000Z');
      });

      it('should handle 1970 offset (+08:00 for South Vietnam)', () => {
        // 1970-01-01 12:00:00 local
        const localDate = new Date('1970-01-01T00:00:00.000Z');
        const localTime = { hour: 12, minute: 0, second: 0 };

        const utcDate = convertLocalTimeToUtc(localDate, localTime, true, 'Asia/Ho_Chi_Minh');

        // 12:00 - 08:00 = 04:00 UTC
        expect(utcDate.toISOString()).toBe('1970-01-01T04:00:00.000Z');
      });

      it('should handle post-1975 offset (+07:00)', () => {
        // 1976-01-01 12:00:00 local
        const localDate = new Date('1976-01-01T00:00:00.000Z');
        const localTime = { hour: 12, minute: 0, second: 0 };

        const utcDate = convertLocalTimeToUtc(localDate, localTime, true, 'Asia/Ho_Chi_Minh');

        // 12:00 - 07:00 = 05:00 UTC
        expect(utcDate.toISOString()).toBe('1976-01-01T05:00:00.000Z');
      });
    });

    describe('DST Gap edge case', () => {
      it('should throw an error for a skipped hour during Spring Forward', () => {
        // In America/New_York, 2023-03-12 02:30:00 doesn't exist (jumps from 01:59:59 to 03:00:00)
        const localDate = new Date('2023-03-12T00:00:00.000Z');
        const localTime = { hour: 2, minute: 30, second: 0 };

        expect(() =>
          convertLocalTimeToUtc(localDate, localTime, true, 'America/New_York'),
        ).toThrowError(/Invalid or ambiguous local time/);
      });
    });
  });
});
