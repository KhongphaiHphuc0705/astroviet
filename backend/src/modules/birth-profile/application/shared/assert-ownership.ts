import { AuthorizationError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';

/**
 * Asserts that the current user owns the birth profile.
 * Throws an AuthorizationError if not.
 */
export function assertOwnership(profile: BirthProfile, currentUserId: string): void {
  if (profile.userId !== currentUserId) {
    throw new AuthorizationError(
      ErrorCode.FORBIDDEN,
      'You do not have permission to access this birth profile',
    );
  }
}
