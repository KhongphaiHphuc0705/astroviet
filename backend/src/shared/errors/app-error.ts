import { ErrorCode } from './error-codes.js';
import { ErrorMetadata } from './error-metadata.js';

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;

  constructor(
    public readonly message: string,
    public readonly details?: ErrorMetadata,
    public readonly cause?: Error | unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly errorCode: string;

  constructor(
    errorCode: string = ErrorCode.VALIDATION_ERROR,
    message: string,
    details?: ErrorMetadata,
  ) {
    super(message, details);
    this.errorCode = errorCode;
  }
}

export class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly errorCode: string;

  constructor(
    errorCode: string = ErrorCode.MALFORMED_REQUEST,
    message = 'Bad Request',
    details?: ErrorMetadata,
  ) {
    super(message, details);
    this.errorCode = errorCode;
  }
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly errorCode: string;

  constructor(
    errorCode: string = ErrorCode.UNAUTHORIZED,
    message = 'Unauthorized',
    details?: ErrorMetadata,
  ) {
    super(message, details);
    this.errorCode = errorCode;
  }
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly errorCode: string;

  constructor(
    errorCode: string = ErrorCode.FORBIDDEN,
    message = 'Forbidden',
    details?: ErrorMetadata,
  ) {
    super(message, details);
    this.errorCode = errorCode;
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = ErrorCode.RESOURCE_NOT_FOUND;

  constructor(message = 'Resource not found', details?: ErrorMetadata) {
    super(message, details);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode: string;

  constructor(errorCode: string, message: string, details?: ErrorMetadata) {
    super(message, details);
    this.errorCode = errorCode;
  }
}

export class InfrastructureError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

  constructor(message = 'Internal Server Error', details?: ErrorMetadata, cause?: Error | unknown) {
    super(message, details, cause);
  }
}

export class ConfigurationError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = ErrorCode.CONFIGURATION_ERROR;

  constructor(message: string, details?: ErrorMetadata, cause?: Error | unknown) {
    super(message, details, cause);
  }
}

export class ExternalServiceError extends AppError {
  readonly statusCode = 500;
  readonly errorCode: string;

  constructor(
    errorCode: string = ErrorCode.EXTERNAL_SERVICE_ERROR,
    message = 'External Service Error',
    details?: ErrorMetadata,
    cause?: Error | unknown,
  ) {
    super(message, details, cause);
    this.errorCode = errorCode;
  }
}

export class DomainError extends AppError {
  readonly statusCode = 422;
  readonly errorCode: string;

  constructor(
    errorCode: string = ErrorCode.DOMAIN_ERROR,
    message: string,
    details?: ErrorMetadata,
  ) {
    super(message, details);
    this.errorCode = errorCode;
  }
}

export class UniqueConstraintError extends InfrastructureError {
  constructor(
    message: string = 'Unique constraint violation',
    details?: ErrorMetadata,
    cause?: Error | unknown,
  ) {
    super(message, details, cause);
  }
}

export class OptimisticLockError extends InfrastructureError {
  constructor(
    message: string = 'Optimistic lock conflict',
    details?: ErrorMetadata,
    cause?: Error | unknown,
  ) {
    super(message, details, cause);
  }
}
