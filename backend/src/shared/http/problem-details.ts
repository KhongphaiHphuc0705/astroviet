import { ErrorMetadata } from '../errors/error-metadata.js';
import { AppError, ErrorCode, InfrastructureError } from '../errors/index.js';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errorCode: string;
  requestId?: string;
  timestamp: string;
  errors?: unknown;
  metadata?: ErrorMetadata;
}

export interface MapErrorContext {
  instance: string;
  requestId?: string;
}

/**
 * Maps an unknown error to an RFC7807 ProblemDetails object.
 * If the error is not an AppError, it wraps it in an InfrastructureError.
 */
export const mapErrorToProblemDetails = (
  error: unknown,
  context: MapErrorContext,
): ProblemDetails => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else {
    // Wrap unknown errors
    const cause = error instanceof Error ? error : new Error(String(error));
    appError = new InfrastructureError('An unexpected error occurred', undefined, cause);
  }

  const { instance, requestId } = context;
  const typeUrl = `https://api.astroviet.vn/errors/${appError.errorCode.toLowerCase().replace(/_/g, '-')}`;

  const errors = appError.details?.errors;
  const metadata = extractMetadata(appError.details);

  return {
    type: typeUrl,
    title: formatTitle(appError.errorCode),
    status: appError.statusCode,
    detail: appError.message,
    instance,
    errorCode: appError.errorCode,
    requestId,
    timestamp: new Date().toISOString(),
    ...(errors !== undefined && { errors }),
    ...(metadata !== undefined && { metadata }),
  };
};

function formatTitle(errorCode: string): string {
  if (errorCode === ErrorCode.INTERNAL_SERVER_ERROR) {
    return 'Internal Server Error';
  }
  return errorCode
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractMetadata(details?: ErrorMetadata): ErrorMetadata | undefined {
  if (!details) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { errors, ...rest } = details;
  if (Object.keys(rest).length === 0) return undefined;
  return rest;
}
