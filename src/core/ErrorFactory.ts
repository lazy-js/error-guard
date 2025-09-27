import { ErrorCategoryEnum, ErrorConstructorEnum, NetworkErrorCodesEnum } from '../enums';
import {
    CustomError,
    ValidationError,
    ConflictError,
    ExternalServiceError,
    NotFoundError,
    InternalError,
    NetworkError,
    AuthorizationError,
    AuthenticationError,
    BadConfigError,
} from './Error';
import { ErrorContextBase } from '../types/errors';

export interface ErrorFactoryOptions {
    serviceName?: string;
    defaultTraceId?: string;
}

export class ErrorFactory {
    private serviceName: string;
    private defaultTraceId?: string;

    constructor(options: ErrorFactoryOptions = {}) {
        this.serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
        this.defaultTraceId = options.defaultTraceId;
    }

    // Create validation error
    createValidationError(code: string, message?: string, context?: Partial<ErrorContextBase>): ValidationError {
        return new ValidationError({
            code,
            message: message || 'Validation failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Create conflict error
    createConflictError(code: string, message?: string, context?: Partial<ErrorContextBase>): ConflictError {
        return new ConflictError({
            code,
            message: message || 'Resource conflict',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Create not found error
    createNotFoundError(code: string, message?: string, context?: Partial<ErrorContextBase>): NotFoundError {
        return new NotFoundError({
            code,
            message: message || 'Resource not found',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Create external service error
    createExternalServiceError(
        code: string,
        externalService: string,
        message?: string,
        context?: Partial<ErrorContextBase>
    ): ExternalServiceError {
        return new ExternalServiceError({
            code,
            message: message || `External service error: ${externalService}`,
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            externalService,
            context: context as ErrorContextBase,
        });
    }

    // Create internal error
    createInternalError(code: string, message?: string, context?: Partial<ErrorContextBase>): InternalError {
        return new InternalError({
            code,
            message: message || 'Internal server error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Create network error
    createNetworkError(
        code: NetworkErrorCodesEnum,
        message?: string,
        context?: Partial<ErrorContextBase>
    ): NetworkError {
        return new NetworkError({
            code,
            message: message || 'Network error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Create authentication error
    createAuthenticationError(
        code: string,
        message?: string,
        context?: Partial<ErrorContextBase>
    ): AuthenticationError {
        return new AuthenticationError({
            code,
            message: message || 'Authentication failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Create authorization error
    createAuthorizationError(code: string, message?: string, context?: Partial<ErrorContextBase>): AuthorizationError {
        return new AuthorizationError({
            code,
            message: message || 'Authorization failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Create bad config error
    createBadConfigError(code: string, message?: string, context?: Partial<ErrorContextBase>): BadConfigError {
        return new BadConfigError({
            code,
            message: message || 'Configuration error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context as ErrorContextBase,
        });
    }

    // Generic error creator based on category
    createError(
        category: ErrorCategoryEnum,
        code: string,
        message?: string,
        context?: Partial<ErrorContextBase>
    ): CustomError {
        switch (category) {
            case ErrorCategoryEnum.VALIDATION:
                return this.createValidationError(code, message, context);
            case ErrorCategoryEnum.CONFLICT:
                return this.createConflictError(code, message, context);
            case ErrorCategoryEnum.NOT_FOUND:
                return this.createNotFoundError(code, message, context);
            case ErrorCategoryEnum.EXTERNAL_SERVICE:
                return this.createExternalServiceError(code, 'unknown', message, context);
            case ErrorCategoryEnum.INTERNAL:
                return this.createInternalError(code, message, context);
            case ErrorCategoryEnum.NETWORK:
                return this.createNetworkError(NetworkErrorCodesEnum.UNKNOWN_ERROR, message, context);
            case ErrorCategoryEnum.AUTHENTICATION:
                return this.createAuthenticationError(code, message, context);
            case ErrorCategoryEnum.AUTHORIZATION:
                return this.createAuthorizationError(code, message, context);
            case ErrorCategoryEnum.BAD_CONFIG:
                return this.createBadConfigError(code, message, context);
            default:
                return this.createInternalError(code, message, context);
        }
    }
}
