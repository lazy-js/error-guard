import { ErrorCategoryEnum, NetworkErrorCodesEnum } from '../enums';
import { ValidationError, ConflictError, ExternalServiceError, NotFoundError, InternalError, NetworkError, AuthorizationError, AuthenticationError, BadConfigError, } from './Error';
export class ErrorFactory {
    constructor(options = {}) {
        this.serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
        this.defaultTraceId = options.defaultTraceId;
    }
    // Create validation error
    createValidationError(code, message, context) {
        return new ValidationError({
            code,
            message: message || 'Validation failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create conflict error
    createConflictError(code, message, context) {
        return new ConflictError({
            code,
            message: message || 'Resource conflict',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create not found error
    createNotFoundError(code, message, context) {
        return new NotFoundError({
            code,
            message: message || 'Resource not found',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create external service error
    createExternalServiceError(code, externalService, message, context) {
        return new ExternalServiceError({
            code,
            message: message || `External service error: ${externalService}`,
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            externalService,
            context: context,
        });
    }
    // Create internal error
    createInternalError(code, message, context) {
        return new InternalError({
            code,
            message: message || 'Internal server error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create network error
    createNetworkError(code, message, context) {
        return new NetworkError({
            code,
            message: message || 'Network error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create authentication error
    createAuthenticationError(code, message, context) {
        return new AuthenticationError({
            code,
            message: message || 'Authentication failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create authorization error
    createAuthorizationError(code, message, context) {
        return new AuthorizationError({
            code,
            message: message || 'Authorization failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create bad config error
    createBadConfigError(code, message, context) {
        return new BadConfigError({
            code,
            message: message || 'Configuration error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Generic error creator based on category
    createError(category, code, message, context) {
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
//# sourceMappingURL=ErrorFactory.js.map