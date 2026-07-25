import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { assertOwnership } from '../../../../../../src/modules/birth-profile/application/shared/assert-ownership.js';
import { BirthProfile } from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';
import { AuthorizationError } from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('assertOwnership helper', () => {
  let mockProfile: BirthProfile;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));

    const now = new Date();
    mockProfile = BirthProfile.create({
      id: 'profile-123',
      userId: 'user-123',
      label: 'My Profile',
      fullName: 'John Doe',
      birthDate: BirthDate.create('1990-01-01'),
      birthTime: BirthTime.create('12:00:00'),
      isBirthTimeKnown: true,
      birthLocation: BirthLocation.create(
        'Ho Chi Minh',
        Coordinates.create(10.8231, 106.6297),
        Timezone.create('Asia/Ho_Chi_Minh'),
      ),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. should not throw if user owns the profile', () => {
    expect(() => assertOwnership(mockProfile, 'user-123')).not.toThrow();
  });

  it('2. should throw AuthorizationError if user does not own the profile', () => {
    expect(() => assertOwnership(mockProfile, 'other-user')).toThrow(AuthorizationError);

    try {
      assertOwnership(mockProfile, 'other-user');
    } catch (error: any) {
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.errorCode).toBe(ErrorCode.FORBIDDEN);
      expect(error.message).toBe('You do not have permission to access this birth profile');
    }
  });
});
