"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = void 0;
const enums_1 = require("../enums");
const Error_1 = require("./Error");
class ErrorFactory {
    constructor(options = {}) {
        this.serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
        this.defaultTraceId = options.defaultTraceId;
    }
    // Create validation error
    createValidationError(code, message, context) {
        return new Error_1.ValidationError({
            code,
            message: message || 'Validation failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create conflict error
    createConflictError(code, message, context) {
        return new Error_1.ConflictError({
            code,
            message: message || 'Resource conflict',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create not found error
    createNotFoundError(code, message, context) {
        return new Error_1.NotFoundError({
            code,
            message: message || 'Resource not found',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create external service error
    createExternalServiceError(code, externalService, message, context) {
        return new Error_1.ExternalServiceError({
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
        return new Error_1.InternalError({
            code,
            message: message || 'Internal server error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create network error
    createNetworkError(code, message, context) {
        return new Error_1.NetworkError({
            code,
            message: message || 'Network error',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create authentication error
    createAuthenticationError(code, message, context) {
        return new Error_1.AuthenticationError({
            code,
            message: message || 'Authentication failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create authorization error
    createAuthorizationError(code, message, context) {
        return new Error_1.AuthorizationError({
            code,
            message: message || 'Authorization failed',
            serviceName: this.serviceName,
            traceId: this.defaultTraceId,
            context: context,
        });
    }
    // Create bad config error
    createBadConfigError(code, message, context) {
        return new Error_1.BadConfigError({
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
            case enums_1.ErrorCategoryEnum.VALIDATION:
                return this.createValidationError(code, message, context);
            case enums_1.ErrorCategoryEnum.CONFLICT:
                return this.createConflictError(code, message, context);
            case enums_1.ErrorCategoryEnum.NOT_FOUND:
                return this.createNotFoundError(code, message, context);
            case enums_1.ErrorCategoryEnum.EXTERNAL_SERVICE:
                return this.createExternalServiceError(code, 'unknown', message, context);
            case enums_1.ErrorCategoryEnum.INTERNAL:
                return this.createInternalError(code, message, context);
            case enums_1.ErrorCategoryEnum.NETWORK:
                return this.createNetworkError(enums_1.NetworkErrorCodesEnum.UNKNOWN_ERROR, message, context);
            case enums_1.ErrorCategoryEnum.AUTHENTICATION:
                return this.createAuthenticationError(code, message, context);
            case enums_1.ErrorCategoryEnum.AUTHORIZATION:
                return this.createAuthorizationError(code, message, context);
            case enums_1.ErrorCategoryEnum.BAD_CONFIG:
                return this.createBadConfigError(code, message, context);
            default:
                return this.createInternalError(code, message, context);
        }
    }
}
exports.ErrorFactory = ErrorFactory;
//# sourceMappingURL=ErrorFactory.js.map