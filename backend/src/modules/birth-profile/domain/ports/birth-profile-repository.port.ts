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
  update(profile: BirthProfile): Promise<void>;
  softDelete(id: string, userId: string): Promise<boolean>;
}
