import { describe, it, expect } from 'vitest';

import { BirthProfile } from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';
import { BirthProfileResponseMapper } from '../../../../../../src/modules/birth-profile/presentation/mappers/birth-profile-response.mapper.js';

describe('BirthProfileResponseMapper', () => {
  it('should map BirthProfile entity to Response correctly without birthTime', () => {
    const profile = BirthProfile.create({
      id: 'profile-123',
      userId: 'user-123',
      label: 'My Profile',
      fullName: 'John Doe',
      birthDate: BirthDate.create('1990-01-01'),
      birthTime: null,
      isBirthTimeKnown: false,
      birthLocation: BirthLocation.create(
        'Hanoi',
        Coordinates.create(21.0285, 105.8542),
        Timezone.create('Asia/Ho_Chi_Minh'),
      ),
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      deletedAt: null,
      version: 1,
    });

    const response = BirthProfileResponseMapper.toResponse(profile);

    expect(response).toMatchObject({
      id: profile.id,
      userId: 'user-123',
      label: 'My Profile',
      fullName: 'John Doe',
      birthDate: '1990-01-01',
      birthTime: null,
      isBirthTimeKnown: false,
      placeName: 'Hanoi',
      latitude: 21.0285,
      longitude: 105.8542,
      historicalTimezoneId: 'Asia/Ho_Chi_Minh',
      warnings: [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  });

  it('should map BirthProfile entity to Response correctly with birthTime', () => {
    const profile = BirthProfile.create({
      id: 'profile-456',
      userId: 'user-123',
      label: 'My Profile 2',
      fullName: null,
      birthDate: BirthDate.create('1990-12-31'),
      birthTime: BirthTime.create('14:30:05'),
      isBirthTimeKnown: true,
      birthLocation: BirthLocation.create(
        'New York',
        Coordinates.create(40.7128, -74.006),
        Timezone.create('America/New_York'),
      ),
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      deletedAt: null,
      version: 1,
    });

    const response = BirthProfileResponseMapper.toResponse(profile);

    expect(response).toMatchObject({
      id: profile.id,
      userId: 'user-123',
      label: 'My Profile 2',
      fullName: null,
      birthDate: '1990-12-31',
      birthTime: '14:30:05',
      isBirthTimeKnown: true,
      placeName: 'New York',
      latitude: 40.7128,
      longitude: -74.006,
      historicalTimezoneId: 'America/New_York',
      warnings: [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  });
});
