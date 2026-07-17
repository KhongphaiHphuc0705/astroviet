import bcrypt from 'bcrypt';

import { InfrastructureError } from '../../../../shared/errors/app-error.js';
import { IPasswordHasher } from '../../domain/ports/password-hasher.port.js';

export class BcryptPasswordHasherAdapter implements IPasswordHasher {
  private readonly costFactor = 12;

  async hash(plainPassword: string): Promise<string> {
    try {
      return await bcrypt.hash(plainPassword, this.costFactor);
    } catch (error) {
      throw new InfrastructureError('Failed to hash password', undefined, error);
    }
  }

  async verify(plainPassword: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hash);
    } catch {
      return false;
    }
  }
}
