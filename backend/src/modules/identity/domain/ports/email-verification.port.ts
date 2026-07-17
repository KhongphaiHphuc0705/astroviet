import { User } from '../entities/user.entity.js';

export interface IEmailVerificationService {
  sendVerification(user: User): Promise<void>;
}
