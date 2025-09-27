"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressErrorHandler = exports.ExpressErrorHandlerMiddleware = void 0;
exports.createExpressErrorHandler = createExpressErrorHandler;
const Error_1 = require("../core/Error");
const ErrorFactory_1 = require("../core/ErrorFactory");
const Console_1 = require("../core/Console");
const enums_1 = require("../enums");
/**
 * Express.js global error handler middleware that integrates with the existing error handling system.
 *
 * This middleware catches all unhandled errors in Express routes, transforms them using the existing
 * CustomError classes, and returns standardized JSON responses.
 */
class ExpressErrorHandlerMiddleware {
    constructor(options = {}) {
        this.options = {
            serviceName: options.serviceName || process.env.SERVICE_NAME || 'unknown',
            traceIdHeader: options.traceIdHeader || 'x-trace-id',
            includeRequestBody: options.includeRequestBody || false,
            maxBodySize: options.maxBodySize || 1024,
            enableLogging: options.enableLogging !== false,
            customErrorTransform: options.customErrorTransform || ((err) => err),
        };
        this.errorFactory = new ErrorFactory_1.ErrorFactory({
            serviceName: this.options.serviceName,
        });
    }
    /**
     * Get the Express error handler function
     */
    getHandler() {
        return (err, req, res, next) => {
            try {
                // Apply custom error transformation if provided
                const transformedError = this.options.customErrorTransform
                    ? this.options.customErrorTransform(err, req)
                    : err;
                // Transform error to CustomError instance
                const customError = this.transformToCustomError(transformedError, req);
                // Extract request metadata for context
                const requestMetadata = this.extractRequestMetadata(req);
                // Update error context with Express request data
                this.updateErrorContext(customError, requestMetadata);
                // Log error if logging is enabled
                if (this.options.enableLogging) {
                    this.logError(customError, requestMetadata);
                }
                // Send standardized error response
                this.sendErrorResponse(res, customError);
            }
            catch (handlerError) {
                // Fallback error handling if the error handler itself fails
                console.error('Error in ExpressErrorHandler:', handlerError);
                this.sendFallbackErrorResponse(res, err);
            }
        };
    }
    /**
     * Transform various error types to CustomError instances
     */
    transformToCustomError(err, req) {
        // If already a CustomError, return as-is
        if (err instanceof Error_1.CustomError) {
            return err;
        }
        // Extract trace ID from request headers
        const traceId = this.extractTraceId(req);
        // Create error context with Express request data
        const context = {
            layer: 'router',
            className: 'ExpressErrorHandler',
            methodName: 'transformToCustomError',
            originalError: err,
        };
        // Determine error category based on error type and properties
        const category = this.determineErrorCategory(err);
        // Create appropriate CustomError using ErrorFactory
        return this.errorFactory.createError(category, this.extractErrorCode(err), err.message || 'An error occurred', context);
    }
    /**
     * Determine error category based on error properties
     */
    determineErrorCategory(err) {
        // Check for specific error types or properties
        if (err.name === 'ValidationError' || err.message.includes('validation')) {
            return enums_1.ErrorCategoryEnum.VALIDATION;
        }
        if (err.name === 'UnauthorizedError' || err.message.includes('unauthorized')) {
            return enums_1.ErrorCategoryEnum.AUTHENTICATION;
        }
        if (err.name === 'ForbiddenError' || err.message.includes('forbidden')) {
            return enums_1.ErrorCategoryEnum.AUTHORIZATION;
        }
        if (err.name === 'NotFoundError' || err.message.includes('not found')) {
            return enums_1.ErrorCategoryEnum.NOT_FOUND;
        }
        if (err.name === 'ConflictError' || err.message.includes('conflict')) {
            return enums_1.ErrorCategoryEnum.CONFLICT;
        }
        if (err.name === 'DatabaseError' || err.message.includes('database')) {
            return enums_1.ErrorCategoryEnum.DATABASE;
        }
        if (err.name === 'NetworkError' || err.message.includes('network')) {
            return enums_1.ErrorCategoryEnum.NETWORK;
        }
        if (err.name === 'ExternalServiceError' || err.message.includes('external service')) {
            return enums_1.ErrorCategoryEnum.EXTERNAL_SERVICE;
        }
        // Default to internal error for unknown types
        return enums_1.ErrorCategoryEnum.INTERNAL;
    }
    /**
     * Extract error code from error instance
     */
    extractErrorCode(err) {
        // Try to extract code from error properties
        if ('code' in err && typeof err.code === 'string') {
            return err.code;
        }
        if ('statusCode' in err && typeof err.statusCode === 'number') {
            return `HTTP_${err.statusCode}`;
        }
        // Use error name as code
        return err.name || 'UNKNOWN_ERROR';
    }
    /**
     * Extract trace ID from request headers
     */
    extractTraceId(req) {
        const traceId = req.get(this.options.traceIdHeader) ||
            req.get('x-request-id') ||
            req.get('x-correlation-id');
        return traceId || undefined;
    }
    /**
     * Extract comprehensive request metadata
     */
    extractRequestMetadata(req) {
        const metadata = {
            method: req.method,
            url: req.url,
            path: req.path,
            query: req.query,
            params: req.params,
            headers: req.headers,
            userAgent: req.get('user-agent') || 'unknown',
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            originalUrl: req.originalUrl,
            baseUrl: req.baseUrl,
        };
        // Add route information if available
        if (req.route) {
            metadata.route = req.route.path;
        }
        // Include request body if enabled and within size limit
        if (this.options.includeRequestBody && req.body) {
            const bodyString = JSON.stringify(req.body);
            if (bodyString.length <= this.options.maxBodySize) {
                metadata.body = req.body;
            }
        }
        return metadata;
    }
    /**
     * Update error context with Express request metadata
     */
    updateErrorContext(error, metadata) {
        const expressContext = {
            layer: 'router',
            className: 'ExpressErrorHandler',
            methodName: 'updateErrorContext',
            method: metadata.method,
            url: metadata.url,
            path: metadata.path,
            query: metadata.query,
            params: metadata.params,
            headers: metadata.headers,
            userAgent: metadata.userAgent,
            ip: metadata.ip,
            route: metadata.route,
            originalUrl: metadata.originalUrl,
            baseUrl: metadata.baseUrl,
            body: metadata.body,
        };
        error.updateContext(expressContext);
        // Set trace ID if available from headers
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
        Console_1.Console.error(`Express Error Handler - ${metadata.method} ${metadata.path}`);
        error.log({ logContext: true, filter: true });
    }
    /**
     * Send standardized error response
     */
    sendErrorResponse(res, error) {
        const response = {
            code: error.code,
            serviceName: error.serviceName,
            message: error.message,
            timestamp: error.timestamp.toISOString(),
            traceId: error.traceId || 'unknown',
            statusCode: error.statusCode,
        };
        res.status(error.statusCode).json(response);
    }
    /**
     * Send fallback error response when error handler fails
     */
    sendFallbackErrorResponse(res, originalError) {
        const response = {
            code: 'ERROR_HANDLER_FAILED',
            serviceName: this.options.serviceName,
            message: 'An error occurred while processing the request',
            timestamp: new Date().toISOString(),
            traceId: 'unknown',
            statusCode: 500,
        };
        res.status(500).json(response);
    }
}
exports.ExpressErrorHandlerMiddleware = ExpressErrorHandlerMiddleware;
/**
 * Factory function to create Express error handler middleware
 */
function createExpressErrorHandler(options) {
    const middleware = new ExpressErrorHandlerMiddleware(options);
    return middleware.getHandler();
}
/**
 * Default Express error handler with standard configuration
 */
exports.expressErrorHandler = createExpressErrorHandler();
//# sourceMappingURL=ExpressErrorHandler.js.map