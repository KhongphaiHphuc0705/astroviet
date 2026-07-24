import { BirthProfile } from '../entities/birth-profile.entity.js';

export interface ListOptions {
  page: number;
  pageSize: number;
  sortBy: 'createdAt' | 'fullName';
  order: 'asc' | 'desc';
}

export interface IBirthProfileRepository {
  create(profile: BirthProfile): Promise<void>;
  findById(id: string): Promise<BirthProfile | null>;
  listByUserId(
    userId: string,
    options: ListOptions,
  ): Promise<{ items: BirthProfile[]; total: number }>;
  /**
   * Updates an existing profile.
   * Note: This method DOES NOT check if the profile is soft-deleted.
   * It is the responsibility of the Use Case to prevent updating soft-deleted profiles if needed.
   * Throws OptimisticLockError if the version does not match.
   */
  update(profile: BirthProfile): Promise<void>;
  softDelete(id: string, userId: string): Promise<boolean>;
}
