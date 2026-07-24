import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { BirthProfile } from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import { PrismaBirthProfileMapper } from '../../../../../../src/modules/birth-profile/infrastructure/mappers/prisma-birth-profile.mapper.js';

describe('PrismaBirthProfileMapper', () => {
  it('1. should correctly map persistence record to domain entity and back', () => {
    // 1. Arrange - create a persistence record
    const persistenceRecord: Prisma.BirthProfileGetPayload<{}> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '987fcdeb-51a2-43d7-9012-345678901234',
      label: 'My Profile',
      full_name: 'John Doe',
      birth_date: new Date('1990-01-01T00:00:00Z'),
      birth_time: new Date('1970-01-01T14:30:45Z'),
      is_birth_time_known: true,
      place_name: 'Ho Chi Minh City',
      latitude: new Prisma.Decimal('10.823100'),
      longitude: new Prisma.Decimal('106.629700'),
      historical_timezone_id: 'Asia/Ho_Chi_Minh',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
      version: 1,
    };

    // 2. Act - map to domain
    const domainEntity = PrismaBirthProfileMapper.toDomain(persistenceRecord);

    // Assert domain entity properties
    expect(domainEntity).toBeInstanceOf(BirthProfile);
    expect(domainEntity.id).toBe(persistenceRecord.id);
    expect(domainEntity.userId).toBe(persistenceRecord.user_id);
    expect(domainEntity.label).toBe(persistenceRecord.label);
    expect(domainEntity.fullName).toBe(persistenceRecord.full_name);
    expect(domainEntity.birthDate.value.getTime()).toBe(persistenceRecord.birth_date.getTime());
    expect(domainEntity.birthTime?.hour).toBe(14);
    expect(domainEntity.birthTime?.minute).toBe(30);
    expect(domainEntity.birthTime?.second).toBe(45);
    expect(domainEntity.isBirthTimeKnown).toBe(true);
    expect(domainEntity.birthLocation.placeName).toBe('Ho Chi Minh City');
    expect(domainEntity.birthLocation.coordinates.latitude).toBe(10.8231);
    expect(domainEntity.birthLocation.coordinates.longitude).toBe(106.6297);
    expect(domainEntity.birthLocation.timezone.value).toBe('Asia/Ho_Chi_Minh');

    // 3. Act - map back to persistence
    const backToPersistence = PrismaBirthProfileMapper.toPersistence(domainEntity);

    // Assert round-trip equivalence
    expect(backToPersistence.id).toBe(persistenceRecord.id);
    expect(backToPersistence.user_id).toBe(persistenceRecord.user_id);
    expect(backToPersistence.label).toBe(persistenceRecord.label);
    expect(backToPersistence.full_name).toBe(persistenceRecord.full_name);
    expect(new Date(backToPersistence.birth_date).getTime()).toBe(persistenceRecord.birth_date.getTime());
    expect(backToPersistence.birth_time ? new Date(backToPersistence.birth_time).getTime() : undefined).toBe(persistenceRecord.birth_time?.getTime());
    expect(backToPersistence.is_birth_time_known).toBe(persistenceRecord.is_birth_time_known);
    expect(backToPersistence.place_name).toBe(persistenceRecord.place_name);
    expect(backToPersistence.latitude).toBe(10.8231);
    expect(backToPersistence.longitude).toBe(106.6297);
    expect(backToPersistence.historical_timezone_id).toBe(persistenceRecord.historical_timezone_id);
    expect(backToPersistence.version).toBe(persistenceRecord.version);
  });

  it('2. should map correctly when birth_time is null', () => {
    const persistenceRecord: Prisma.BirthProfileGetPayload<{}> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '987fcdeb-51a2-43d7-9012-345678901234',
      label: 'My Profile',
      full_name: null,
      birth_date: new Date('1990-01-01T00:00:00Z'),
      birth_time: null,
      is_birth_time_known: false,
      place_name: 'Unknown',
      latitude: new Prisma.Decimal('0'),
      longitude: new Prisma.Decimal('0'),
      historical_timezone_id: 'UTC',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
      version: 1,
    };

    const domainEntity = PrismaBirthProfileMapper.toDomain(persistenceRecord);
    expect(domainEntity.birthTime).toBeNull();
    expect(domainEntity.isBirthTimeKnown).toBe(false);

    const backToPersistence = PrismaBirthProfileMapper.toPersistence(domainEntity);
    expect(backToPersistence.birth_time).toBeNull();
    expect(backToPersistence.is_birth_time_known).toBe(false);
  });

  it('3. toUpdatePersistence should not include unchangeable fields', () => {
    const persistenceRecord: Prisma.BirthProfileGetPayload<{}> = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '987fcdeb-51a2-43d7-9012-345678901234',
      label: 'My Profile',
      full_name: 'John Doe',
      birth_date: new Date('1990-01-01T00:00:00Z'),
      birth_time: new Date('1970-01-01T14:30:45Z'),
      is_birth_time_known: true,
      place_name: 'Ho Chi Minh City',
      latitude: new Prisma.Decimal('10.823100'),
      longitude: new Prisma.Decimal('106.629700'),
      historical_timezone_id: 'Asia/Ho_Chi_Minh',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
      version: 1,
    };

    const domainEntity = PrismaBirthProfileMapper.toDomain(persistenceRecord);
    const updatePayload = PrismaBirthProfileMapper.toUpdatePersistence(domainEntity);

    // update payload should not have user_id, created_at, or version (version handled explicitly in repo)
    expect(updatePayload).not.toHaveProperty('user_id');
    expect(updatePayload).not.toHaveProperty('created_at');
    expect(updatePayload).not.toHaveProperty('version');

    expect(updatePayload.label).toBe(persistenceRecord.label);
    expect(updatePayload.full_name).toBe(persistenceRecord.full_name);
  });
});
