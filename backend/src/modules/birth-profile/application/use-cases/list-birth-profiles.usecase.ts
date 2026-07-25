import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';
import {
  IBirthProfileRepository,
  ListOptions,
} from '../../domain/ports/birth-profile-repository.port.js';

export interface ListBirthProfilesCommand {
  userId: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'fullName';
  order?: 'asc' | 'desc';
}

export interface ListBirthProfilesResult {
  items: BirthProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListBirthProfilesUseCase {
  constructor(private readonly repository: IBirthProfileRepository) {}

  async execute(command: ListBirthProfilesCommand): Promise<ListBirthProfilesResult> {
    const page = command.page && command.page > 0 ? command.page : 1;
    let pageSize = command.pageSize && command.pageSize > 0 ? command.pageSize : 20;

    // Clamp pageSize to maximum 100
    if (pageSize > 100) {
      pageSize = 100;
    }

    const options: ListOptions = {
      page,
      pageSize,
      sortBy: command.sortBy || 'createdAt',
      order: command.order || 'desc',
    };

    const { items, total } = await this.repository.listByUserId(command.userId, options);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}
