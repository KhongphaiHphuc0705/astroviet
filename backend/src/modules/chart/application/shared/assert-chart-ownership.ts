import { AuthorizationError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { Chart } from '../../domain/entities/chart.entity.js';

/**
 * Asserts that the requesting user owns the given chart.
 *
 * @throws {AuthorizationError} if the user does not own the chart.
 */
export function assertChartOwnership(chart: Chart, requestingUserId: string): void {
  if (chart.userId !== requestingUserId) {
    throw new AuthorizationError(ErrorCode.FORBIDDEN, 'You do not have access to this chart');
  }
}
