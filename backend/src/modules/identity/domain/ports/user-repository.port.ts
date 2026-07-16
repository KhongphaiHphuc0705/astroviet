import { User } from '../entities/user.entity.js';

export interface IUserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  update(user: User): Promise<void>;
}
