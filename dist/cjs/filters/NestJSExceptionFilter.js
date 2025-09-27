"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nestJSExceptionFilter = exports.NestJSGlobalExceptionFilter = void 0;
exports.createNestJSExceptionFilter = createNestJSExceptionFilter;
const common_1 = require("@nestjs/common");
const Error_1 = require("../core/Error");
const ErrorFactory_1 = require("../core/ErrorFactory");
const enums_1 = require("../enums");
const zod_1 = require("zod");
const class_validator_1 = require("class-validator");
/**
 * NestJS global exception filter that integrates with the existing error handling system.
 *
 * This filter catches all unhandled exceptions in NestJS applications, transforms them using the existing
 * CustomError classes, and returns standardized JSON responses.
 */
let NestJSGlobalExceptionFilter = class NestJSGlobalExceptionFilter {
    constructor(options = {}) {
        this.options = {
            serviceName: options.serviceName || process.env.SERVICE_NAME || 'unknown',
            traceIdHeader: options.traceIdHeader || 'x-trace-id',
            includeRequestBody: options.includeRequestBody || false,
            maxBodySize: options.maxBodySize || 1024,
            enableLogging: options.enableLogging !== false,
            logger: options.logger || console,
        };
        this.errorFactory = new ErrorFactory_1.ErrorFactory({
            serviceName: this.options.serviceName,
        });
    }
    /**
     * Main exception handling method
     */
    catch(exception, host) {
        try {
            // Transform exception to CustomError instance
            const customError = this.transformToCustomError(exception, host);
            // Extract request metadata for context
            const requestMetadata = this.extractRequestMetadata(host);
            // Update error context with NestJS request data
            this.updateErrorContext(customError, requestMetadata);
            // Log error if logging is enabled
            if (this.options.enableLogging) {
                this.logError(customError, requestMetadata);
            }
            // Send standardized error response
            this.sendErrorResponse(host, customError);
        }
        catch (handlerError) {
            // Fallback error handling if the exception filter itself fails
            this.options.logger.error('Error in NestJSGlobalExceptionFilter:', handlerError);
            this.sendFallbackErrorResponse(host, exception);
        }
    }
    /**
     * Transform various exception types to CustomError instances
     */
    transformToCustomError(exception, host) {
        // If already a CustomError, return as-is
        if (exception instanceof Error_1.CustomError) {
            return exception;
        }
        // Handle Zod error transformation to validation error
        if (this.isZodError(exception)) {
            return this.transformZodErrorToValidationError(exception);
        }
        // Handle class-validator error transformation to validation error
        if (this.isClassValidatorError(exception)) {
            return this.transformClassValidatorErrorToValidationError(exception);
        }
        // Handle NestJS HttpException
        if (exception instanceof common_1.HttpException) {
            return this.transformHttpException(exception, host);
        }
        // Extract trace ID from request
        const traceId = this.extractTraceId(host);
        // Create error context with NestJS request data
        const context = {
            layer: 'CONTROLLER',
            className: 'NestJSGlobalExceptionFilter',
            methodName: 'transformToCustomError',
            originalError: exception instanceof Error ? exception : new Error(String(exception)),
        };
        // Determine error category based on exception type and properties
        const category = this.determineErrorCategory(exception);
        // Create appropriate CustomError using ErrorFactory
        return this.errorFactory.createError(category, this.extractErrorCode(exception), this.extractErrorMessage(exception), context);
    }
    /**
     * Transform NestJS HttpException to CustomError
     */
    transformHttpException(exception, host) {
        const status = exception.getStatus();
        const response = exception.getResponse();
        const traceId = this.extractTraceId(host);
        // Extract exception details
        const details = typeof response === 'string'
            ? { statusCode: status, message: response }
            : {
                statusCode: status,
                message: (response === null || response === void 0 ? void 0 : response.message) || 'Unknown error',
                ...response,
            };
        // Create error context
        const context = {
            layer: 'CONTROLLER',
            className: 'NestJSGlobalExceptionFilter',
            methodName: 'transformHttpException',
            originalError: exception,
            code: details.code || details.error,
        };
        // Determine error category based on status code
        const category = this.determineErrorCategoryFromStatus(status);
        // Create CustomError using ErrorFactory
        return this.errorFactory.createError(category, details.code || details.error || `HTTP_${status}`, Array.isArray(details.message) ? details.message.join(', ') : details.message, context);
    }
    /**
     * Check if exception is a Zod error
     */
    isZodError(exception) {
        return exception instanceof zod_1.ZodError;
    }
    /**
     * Check if exception is a class-validator error
     */
    isClassValidatorError(exception) {
        if (Array.isArray(exception) && exception.length) {
            return exception.every((err) => err instanceof class_validator_1.ValidationError);
        }
        return exception instanceof class_validator_1.ValidationError;
    }
    /**
     * Transform Zod error to ValidationError
     */
    transformZodErrorToValidationError(zodError) {
        let standardShapeError = this.transformZodErrorToStandardShape(zodError)[0];
        if (!standardShapeError) {
            console.warn('zod error transforming issue, check error handler');
            standardShapeError = { code: 'UNKNOWN_VALIDATION_ERROR' };
        }
        const errorContext = { ...standardShapeError, originalError: zodError };
        const errorStack = zodError.stack;
        return new Error_1.ValidationError({
            code: standardShapeError.code,
            message: standardShapeError.message,
            stack: errorStack,
            context: errorContext,
        });
    }
    /**
     * Transform class-validator error to ValidationError
     */
    transformClassValidatorErrorToValidationError(classValidatorError) {
        let standardShapeError = this.transformClassValidatorErrorsToStandardShape(classValidatorError)[0];
        if (!standardShapeError) {
            console.warn('class validator error transforming issue, check error handler');
            standardShapeError = { code: 'UNKNOWN_CLASS_VALIDATOR_ERROR' };
        }
        const errorContext = { ...standardShapeError };
        return new Error_1.ValidationError({
            code: standardShapeError.code,
            message: standardShapeError.message,
            context: errorContext,
        });
    }
    /**
     * Transform Zod error to standard shape
     */
    transformZodErrorToStandardShape(zodError, stopOnFirstError = true) {
        let newErrorsShape = [];
        if (zodError.issues && Array.isArray(zodError.issues))
            for (const issue of zodError.issues) {
                const code = issue.message;
                const message = issue.message;
                const constraint = issue.code;
                const path = issue.path.join('.');
                const value = issue.input;
                const errorShape = {
                    code,
                    path,
                    message,
                    constraint,
                    value,
                    originalContext: issue,
                };
                newErrorsShape.push(errorShape);
                if (stopOnFirstError)
                    break;
            }
        return newErrorsShape;
    }
    /**
     * Transform single class-validator error to standard shape
     */
    transformClassValidatorErrorToStandardShape(classValidatorError, stopOnFirstError = true) {
        var _a, _b;
        let newErrorsShape = [];
        if (classValidatorError.constraints) {
            for (const constraint of Object.keys(classValidatorError.constraints)) {
                const err = {
                    code: ((_a = classValidatorError === null || classValidatorError === void 0 ? void 0 : classValidatorError.constraints) === null || _a === void 0 ? void 0 : _a[constraint]) || 'UNKNOWN_CODE',
                    message: ((_b = classValidatorError === null || classValidatorError === void 0 ? void 0 : classValidatorError.constraints) === null || _b === void 0 ? void 0 : _b[constraint]) || 'UNKNOWN_MESSAGE',
                    path: classValidatorError.property,
                    value: classValidatorError.value,
                    constraint: constraint,
                    originalContext: classValidatorError.contexts,
                };
                newErrorsShape.push(err);
                if (stopOnFirstError)
                    break;
            }
        }
        return newErrorsShape;
    }
    /**
     * Transform class-validator errors to standard shape
     */
    transformClassValidatorErrorsToStandardShape(classValidatorErrors, stopOnFirstError = true) {
        let newErrorsShape = [];
        if (!Array.isArray(classValidatorErrors)) {
            newErrorsShape.push(...this.transformClassValidatorErrorToStandardShape(classValidatorErrors, stopOnFirstError));
            return newErrorsShape;
        }
        for (const classValidatorError of classValidatorErrors) {
            if (classValidatorError.constraints && typeof classValidatorError.constraints === 'object') {
                newErrorsShape.push(...this.transformClassValidatorErrorToStandardShape(classValidatorError, stopOnFirstError));
                if (stopOnFirstError)
                    break;
            }
            if (classValidatorError.children && classValidatorError.children.length > 0) {
                newErrorsShape.push(...this.transformClassValidatorErrorsToStandardShape(classValidatorError.children, stopOnFirstError));
                if (stopOnFirstError)
                    break;
            }
        }
        return newErrorsShape;
    }
    /**
     * Determine error category based on exception properties
     */
    determineErrorCategory(exception) {
        if (exception instanceof Error) {
            const name = exception.name;
            const message = exception.message.toLowerCase();
            if (name === 'ValidationError' || message.includes('validation')) {
                return enums_1.ErrorCategoryEnum.VALIDATION;
            }
            if (name === 'UnauthorizedError' || message.includes('unauthorized')) {
                return enums_1.ErrorCategoryEnum.AUTHENTICATION;
            }
            if (name === 'ForbiddenError' || message.includes('forbidden')) {
                return enums_1.ErrorCategoryEnum.AUTHORIZATION;
            }
            if (name === 'NotFoundError' || message.includes('not found')) {
                return enums_1.ErrorCategoryEnum.NOT_FOUND;
            }
            if (name === 'ConflictError' || message.includes('conflict')) {
                return enums_1.ErrorCategoryEnum.CONFLICT;
            }
            if (name === 'DatabaseError' || message.includes('database')) {
                return enums_1.ErrorCategoryEnum.DATABASE;
            }
            if (name === 'NetworkError' || message.includes('network')) {
                return enums_1.ErrorCategoryEnum.NETWORK;
            }
            if (name === 'ExternalServiceError' || message.includes('external service')) {
                return enums_1.ErrorCategoryEnum.EXTERNAL_SERVICE;
            }
        }
        // Default to internal error for unknown types
        return enums_1.ErrorCategoryEnum.INTERNAL;
    }
    /**
     * Determine error category from HTTP status code
     */
    determineErrorCategoryFromStatus(status) {
        if (status >= 400 && status < 500) {
            switch (status) {
                case 400:
                    return enums_1.ErrorCategoryEnum.VALIDATION;
                case 401:
                    return enums_1.ErrorCategoryEnum.AUTHENTICATION;
                case 403:
                    return enums_1.ErrorCategoryEnum.AUTHORIZATION;
                case 404:
                    return enums_1.ErrorCategoryEnum.NOT_FOUND;
                case 409:
                    return enums_1.ErrorCategoryEnum.CONFLICT;
                default:
                    return enums_1.ErrorCategoryEnum.VALIDATION;
            }
        }
        if (status >= 500) {
            return enums_1.ErrorCategoryEnum.INTERNAL;
        }
        return enums_1.ErrorCategoryEnum.INTERNAL;
    }
    /**
     * Extract error code from exception instance
     */
    extractErrorCode(exception) {
        if (exception instanceof Error) {
            // Try to extract code from error properties
            if ('code' in exception && typeof exception.code === 'string') {
                return exception.code;
            }
            if ('statusCode' in exception && typeof exception.statusCode === 'number') {
                return `HTTP_${exception.statusCode}`;
            }
            // Use error name as code
            return exception.name || 'UNKNOWN_ERROR';
        }
        return 'UNKNOWN_ERROR';
    }
    /**
     * Extract error message from exception instance
     */
    extractErrorMessage(exception) {
        if (exception instanceof Error) {
            return exception.message;
        }
        if (typeof exception === 'string') {
            return exception;
        }
        return 'An unexpected error occurred';
    }
    /**
     * Extract trace ID from NestJS request
     */
    extractTraceId(host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const headers = (request === null || request === void 0 ? void 0 : request.headers) || {};
        return headers[this.options.traceIdHeader] || headers['x-request-id'] || headers['x-correlation-id'];
    }
    /**
     * Extract comprehensive request metadata from NestJS ArgumentsHost
     */
    extractRequestMetadata(host) {
        var _a, _b;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const metadata = {
            method: (request === null || request === void 0 ? void 0 : request.method) || 'UNKNOWN',
            url: (request === null || request === void 0 ? void 0 : request.url) || '/',
            path: (request === null || request === void 0 ? void 0 : request.path) || '/',
            query: (request === null || request === void 0 ? void 0 : request.query) || {},
            params: (request === null || request === void 0 ? void 0 : request.params) || {},
            headers: (request === null || request === void 0 ? void 0 : request.headers) || {},
            userAgent: (request === null || request === void 0 ? void 0 : request.get('user-agent')) || 'unknown',
            ip: (request === null || request === void 0 ? void 0 : request.ip) || ((_a = request === null || request === void 0 ? void 0 : request.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) || 'unknown',
            originalUrl: (request === null || request === void 0 ? void 0 : request.originalUrl) || (request === null || request === void 0 ? void 0 : request.url) || '/',
        };
        // Add controller and handler information if available
        if (request === null || request === void 0 ? void 0 : request.route) {
            metadata.route = request.route.path;
        }
        // Extract controller and handler names from request context
        const handler = request === null || request === void 0 ? void 0 : request.handler;
        if (handler) {
            metadata.controllerName = ((_b = handler.constructor) === null || _b === void 0 ? void 0 : _b.name) || 'UnknownController';
            metadata.handlerName = handler.name || 'unknown';
        }
        // Include request body if enabled and within size limit
        if (this.options.includeRequestBody && (request === null || request === void 0 ? void 0 : request.body)) {
            const bodyString = JSON.stringify(request.body);
            if (bodyString.length <= this.options.maxBodySize) {
                metadata.body = request.body;
            }
        }
        return metadata;
    }
    /**
     * Update error context with NestJS request metadata
     */
    updateErrorContext(error, metadata) {
        const nestjsContext = {
            layer: 'CONTROLLER',
            className: 'NestJSGlobalExceptionFilter',
            methodName: 'updateErrorContext',
            method: metadata.method,
            url: metadata.url,
            path: metadata.path,
            query: metadata.query,
            params: metadata.params,
            headers: metadata.headers,
            userAgent: metadata.userAgent,
            ip: metadata.ip,
            controllerName: metadata.controllerName,
            handlerName: metadata.handlerName,
            route: metadata.route,
            originalUrl: metadata.originalUrl,
            body: metadata.body,
        };
        error.updateContext(nestjsContext);
        // Set trace ID if available
        const traceId = metadata.headers[this.options.traceIdHeader.toLowerCase()] ||
            metadata.headers['x-request-id'] ||
            metadata.headers['x-correlation-id'];
        if (traceId) {
            error.setTraceId(traceId);
        }
    }
    /**
     * Log error using existing Console utility
     */
    logError(error, metadata) {
        this.options.logger.error(`NestJS Exception Filter - ${metadata.method} ${metadata.path}`);
        error.log({ logContext: true, filter: true });
    }
    /**
     * Send standardized error response
     */
    sendErrorResponse(host, error) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const responseBody = {
            code: error.code,
            serviceName: error.serviceName,
            message: error.message,
            timestamp: error.timestamp.toISOString(),
            traceId: error.traceId || 'unknown',
            statusCode: error.statusCode,
        };
        response.status(error.statusCode).json(responseBody);
    }
    /**
     * Send fallback error response when exception filter fails
     */
    sendFallbackErrorResponse(host, originalException) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const responseBody = {
            code: 'EXCEPTION_FILTER_FAILED',
            serviceName: this.options.serviceName,
            message: 'An error occurred while processing the request',
            timestamp: new Date().toISOString(),
            traceId: 'unknown',
            statusCode: 500,
        };
        response.status(500).json(responseBody);
    }
};
exports.NestJSGlobalExceptionFilter = NestJSGlobalExceptionFilter;
exports.NestJSGlobalExceptionFilter = NestJSGlobalExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [Object])
], NestJSGlobalExceptionFilter);
/**
 * Factory function to create NestJS exception filter
 */
function createNestJSExceptionFilter(options) {
    return new NestJSGlobalExceptionFilter(options);
}
/**
 * Default NestJS exception filter with standard configuration
 */
exports.nestJSExceptionFilter = createNestJSExceptionFilter();
//# sourceMappingURL=NestJSExceptionFilter.js.map