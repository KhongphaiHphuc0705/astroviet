import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

import {
  ListBirthProfilesUseCase,
  ListBirthProfilesCommand,
} from '../../../../../../src/modules/birth-profile/application/use-cases/list-birth-profiles.usecase.js';
import { BirthProfile } from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import { IBirthProfileRepository } from '../../../../../../src/modules/birth-profile/domain/ports/birth-profile-repository.port.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';
import { InfrastructureError } from '../../../../../../src/shared/errors/app-error.js';

describe('ListBirthProfilesUseCase', () => {
  let repository: Mocked<IBirthProfileRepository>;
  let useCase: ListBirthProfilesUseCase;
  let mockProfile: BirthProfile;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new ListBirthProfilesUseCase(repository);

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

  it('1. should return list with default pagination and sorting (Happy Path)', async () => {
    repository.listByUserId.mockResolvedValue({ items: [mockProfile], total: 1 });

    const command: ListBirthProfilesCommand = { userId: 'user-123' };
    const result = await useCase.execute(command);

    expect(result.items).toEqual([mockProfile]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);

    expect(repository.listByUserId).toHaveBeenCalledTimes(1);
    expect(repository.listByUserId).toHaveBeenCalledWith('user-123', {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      order: 'desc',
    });
  });

  it('2. should clamp pageSize to 100 if it exceeds the limit (Pagination Clamp)', async () => {
    repository.listByUserId.mockResolvedValue({ items: [], total: 0 });

    const command: ListBirthProfilesCommand = { userId: 'user-123', page: 2, pageSize: 500 };
    const result = await useCase.execute(command);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(100);

    expect(repository.listByUserId).toHaveBeenCalledTimes(1);
    expect(repository.listByUserId).toHaveBeenCalledWith('user-123', {
      page: 2,
      pageSize: 100, // clamped
      sortBy: 'createdAt',
      order: 'desc',
    });
  });

  it('3. should pass custom sorting and ordering correctly', async () => {
    repository.listByUserId.mockResolvedValue({ items: [mockProfile], total: 1 });

    const command: ListBirthProfilesCommand = {
      userId: 'user-123',
      sortBy: 'fullName',
      order: 'asc',
    };
    const result = await useCase.execute(command);

    expect(result.items).toEqual([mockProfile]);

    expect(repository.listByUserId).toHaveBeenCalledWith('user-123', {
      page: 1,
      pageSize: 20,
      sortBy: 'fullName',
      order: 'asc',
    });
  });

  // 4. Filtering - Not applicable. Only userId is used for filtering.

  it('5. should not catch InfrastructureError from repository (Repository Exception)', async () => {
    const error = new InfrastructureError('DB error');
    repository.listByUserId.mockRejectedValue(error);

    const command: ListBirthProfilesCommand = { userId: 'user-123' };

    await expect(useCase.execute(command)).rejects.toThrow(InfrastructureError);
    expect(repository.listByUserId).toHaveBeenCalledTimes(1);
  });

  it('6. should handle case where total is 0 gracefully (Edge Case)', async () => {
    repository.listByUserId.mockResolvedValue({ items: [], total: 0 });

    const command: ListBirthProfilesCommand = { userId: 'user-123' };
    const result = await useCase.execute(command);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
