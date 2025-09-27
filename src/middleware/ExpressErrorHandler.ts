import { Request, Response, NextFunction } from 'express';
import { CustomError, InternalError, ValidationError } from '../core/Error';

import {
    ExpressErrorHandler,
    ExpressErrorHandlerOptions,
    ExpressErrorResponse,
    ExpressErrorContext,
    RequestMetadata,
} from '../types/express';
import { ZodError } from 'zod';
import { ValidationErrorContext } from '../types';
import { ValidationError as ClassValidatorError } from 'class-validator';

interface ValidationErrorStandardShape {
    code: string;
    message?: string;
    path?: string;
    value?: any;
    constraint?: string;
    originalContext?: Record<string, any>;
}
/**
 * Express.js global error handler middleware that integrates with the existing error handling system.
 *
 * This middleware catches all unhandled errors in Express routes, transforms them using the existing
 * CustomError classes, and returns standardized JSON responses. It provides comprehensive error
 * transformation, logging, and metadata extraction for debugging and monitoring purposes.
 *
 * ## Features
 * - **Error Transformation**: Converts various error types (ZodError, ClassValidatorError, etc.) to standardized CustomError instances
 * - **Request Metadata**: Extracts comprehensive request information for debugging context
 * - **Trace ID Support**: Automatically extracts and assigns trace IDs for distributed tracing
 * - **Configurable Logging**: Integrates with existing Console utility for structured error logging
 * - **Security**: Optional request body inclusion with size limits to prevent sensitive data exposure
 * - **Fallback Handling**: Graceful degradation when the error handler itself encounters issues
 *
 * ## Usage
 * ```typescript
 * import { ExpressErrorHandlerMiddleware } from './middleware/ExpressErrorHandler';
 * import express from 'express';
 *
 * const app = express();
 *
 * // Create error handler with custom options
 * const errorHandler = new ExpressErrorHandlerMiddleware({
 *   serviceName: 'my-service',
 *   traceIdHeader: 'x-trace-id',
 *   includeRequestBody: true,
 *   maxBodySize: 2048,
 *   enableLogging: true
 * });
 *
 * // Apply as global error handler
 * app.use(errorHandler.getHandler());
 * ```
 *
 * ## Error Response Format
 * ```json
 * {
 *   "code": "VALIDATION_ERROR",
 *   "serviceName": "my-service",
 *   "message": "Invalid input data",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "traceId": "abc123-def456",
 *   "statusCode": 400
 * }
 * ```
 *
 * @class ExpressErrorHandlerMiddleware
 * @since 1.0.0
 */
export class ExpressErrorHandlerMiddleware {
    private options: Required<ExpressErrorHandlerOptions>;

    /**
     * Creates a new ExpressErrorHandlerMiddleware instance with the provided configuration options.
     *
     * @param options - Configuration options for the error handler
     * @param options.serviceName - Service name to include in error responses (defaults to process.env.SERVICE_NAME or 'unknown')
     * @param options.traceIdHeader - Header name to extract trace ID from (defaults to 'x-trace-id')
     * @param options.includeRequestBody - Whether to include request body in error context (defaults to false for security)
     * @param options.maxBodySize - Maximum size of request body to include in bytes (defaults to 1024)
     * @param options.enableLogging - Whether to enable error logging (defaults to true)
     * @param options.logger - Custom logger instance (defaults to console)
     *
     * @example
     * ```typescript
     * // Basic usage with defaults
     * const errorHandler = new ExpressErrorHandlerMiddleware();
     *
     * // Custom configuration
     * const errorHandler = new ExpressErrorHandlerMiddleware({
     *   serviceName: 'user-service',
     *   traceIdHeader: 'x-request-id',
     *   includeRequestBody: true,
     *   maxBodySize: 2048,
     *   enableLogging: true,
     *   logger: customLogger
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(options: ExpressErrorHandlerOptions = {}) {
        this.options = {
            serviceName: options.serviceName || process.env.SERVICE_NAME || 'unknown',
            traceIdHeader: options.traceIdHeader || 'x-trace-id',
            includeRequestBody: options.includeRequestBody || false,
            maxBodySize: options.maxBodySize || 1024,
            enableLogging: options.enableLogging !== false,
            logger: options.logger || console,
        };
    }

    /**
     * Returns the Express error handler function that can be used as middleware.
     *
     * This method creates and returns a function that conforms to Express's error handler signature.
     * The returned function handles the complete error processing pipeline:
     * 1. Transforms errors to standardized CustomError instances
     * 2. Extracts and assigns request metadata for debugging context
     * 3. Assigns trace IDs for distributed tracing
     * 4. Logs errors using the configured logger
     * 5. Sends standardized JSON error responses
     *
     * @returns {ExpressErrorHandler} Express error handler function
     *
     * @example
     * ```typescript
     * const errorHandler = new ExpressErrorHandlerMiddleware();
     * app.use(errorHandler.getHandler());
     *
     * // Or use with specific routes
     * app.use('/api', errorHandler.getHandler());
     * ```
     *
     * @since 1.0.0
     */
    getHandler(): ExpressErrorHandler {
        return (err: Error, req: Request, res: Response, next: NextFunction): void => {
            try {
                // Transform error to CustomError instance
                const standardError = this.transformToStandardError(err, req);

                // Extract request metadata for context
                const errorWithMetadata = this.assignMetadata(standardError, req);

                // Update error context with Express request data
                const errorWithTraceId = this.assignTraceId(errorWithMetadata, req);

                // Log error if logging is enabled
                if (this.options.enableLogging) {
                    this.logError(errorWithTraceId);
                }

                // Send standardized error response
                this.sendErrorResponse(res, errorWithTraceId);
            } catch (handlerError) {
                // Fallback error handling if the error handler itself fails
                this.options.logger.error('Error in ExpressErrorHandler:', handlerError);
                this.sendFallbackErrorResponse(res, err);
            }
        };
    }

    /**
     * Transforms various error types to standardized CustomError instances.
     *
     * This method handles the conversion of different error types to the internal CustomError format:
     * - CustomError instances are returned as-is
     * - ZodError instances are converted to ValidationError
     * - ClassValidatorError instances are converted to ValidationError
     * - All other errors are wrapped as InternalError
     *
     * @private
     * @param err - The error to transform
     * @param req - Express request object for context
     * @returns {CustomError} Standardized error instance
     *
     * @since 1.0.0
     */
    private transformToStandardError(err: Error, req: Request): CustomError {
        // If already a CustomError return the same error
        if (err instanceof CustomError) {
            return err;
        }

        // handle zod error transformation to validation error
        if (err instanceof ZodError) {
            return this.transformZodErrorToValidationError(err);
        }

        // handle class validator error
        if (this.isClassValidatorError(err)) {
            return this.transformClassValidatorErrorToValidationError(
                err as unknown as ClassValidatorError | ClassValidatorError[]
            );
        }

        // Create error context with Express request data
        const context: ExpressErrorContext = {
            layer: 'router' as any,
            className: 'ExpressErrorHandler',
            methodName: 'transformToStandardError',
            originalError: err,
        };

        // Create appropriate CustomError using ErrorFactory
        return new InternalError({ code: 'INTERNAL_SERVER_ERROR', context });
    }

    /**
     * Checks if the provided error is a ClassValidatorError or array of ClassValidatorErrors.
     *
     * @private
     * @param err - The error to check
     * @returns {boolean} True if the error is a ClassValidatorError or array of ClassValidatorErrors
     *
     * @since 1.0.0
     */
    private isClassValidatorError(err: any): boolean {
        if (Array.isArray(err) && err.length) {
            return err.every((err) => err instanceof ClassValidatorError);
        }
        return err instanceof ClassValidatorError;
    }

    /**
     * Transforms a ZodError to a ValidationError instance.
     *
     * Converts Zod validation errors to the standardized ValidationError format,
     * preserving validation details and original error context.
     *
     * @private
     * @param zodError - The ZodError to transform
     * @returns {ValidationError} Transformed validation error
     *
     * @since 1.0.0
     */
    private transformZodErrorToValidationError(zodError: ZodError): ValidationError {
        let standardShapeError = this.transformZodErrorToStandardShape(zodError)[0];
        if (!standardShapeError) {
            this.options.logger.warn('zod error transforming issue, check error handler');
            standardShapeError = { code: 'UNKNOWN_VALIDATION_ERROR' };
        }
        const errorContext: ValidationErrorContext = { ...standardShapeError, originalError: zodError };
        const errorStack = zodError.stack;
        return new ValidationError({
            code: standardShapeError.code,
            message: standardShapeError.message,
            stack: errorStack,
            context: errorContext,
        });
    }

    /**
     * Transforms ClassValidatorError(s) to a ValidationError instance.
     *
     * Converts class-validator errors to the standardized ValidationError format,
     * handling both single errors and arrays of errors.
     *
     * @private
     * @param classValidatorError - The ClassValidatorError or array of ClassValidatorErrors to transform
     * @returns {ValidationError} Transformed validation error
     *
     * @since 1.0.0
     */
    private transformClassValidatorErrorToValidationError(
        classValidatorError: ClassValidatorError | ClassValidatorError[]
    ): ValidationError {
        let standardShapeError = this.transformClassValidatorErrorsToStandardShape(classValidatorError)[0];
        if (!standardShapeError) {
            this.options.logger.warn('class validator error transforming issue, check error handler');
            standardShapeError = { code: 'UNKNOWN_VALIDATION_ERROR' };
        }
        const errorContext: ValidationErrorContext = { ...standardShapeError };

        return new ValidationError({
            code: standardShapeError.code,
            message: standardShapeError.message,
            context: errorContext,
        });
    }

    /**
     * Transforms ZodError issues to a standardized validation error shape.
     *
     * Converts Zod validation issues to a consistent format that can be used
     * across different validation libraries.
     *
     * @private
     * @param zodError - The ZodError to transform
     * @param stopOnFirstError - Whether to stop processing after the first error (defaults to true)
     * @returns {ValidationErrorStandardShape[]} Array of standardized validation error shapes
     *
     * @since 1.0.0
     */
    private transformZodErrorToStandardShape(
        zodError: ZodError,
        stopOnFirstError: boolean = true
    ): ValidationErrorStandardShape[] {
        let newErrorsShape: ValidationErrorStandardShape[] = [];
        if (zodError.issues && Array.isArray(zodError.issues))
            for (const issue of zodError.issues) {
                const code = issue.message;
                const message = issue.message;
                const constraint = issue.code;
                const path = issue.path.join('.');
                const value = issue.input;

                const errorShape: ValidationErrorStandardShape = {
                    code,
                    path,
                    message,
                    constraint,
                    value,
                    originalContext: issue,
                };
                newErrorsShape.push(errorShape);
                if (stopOnFirstError) break;
            }
        return newErrorsShape;
    }

    /**
     * Transforms a single ClassValidatorError to a standardized validation error shape.
     *
     * Converts class-validator error constraints to a consistent format.
     *
     * @private
     * @param classValidatorError - The ClassValidatorError to transform
     * @param stopOnFirstError - Whether to stop processing after the first error (defaults to true)
     * @returns {ValidationErrorStandardShape[]} Array of standardized validation error shapes
     *
     * @since 1.0.0
     */
    private transformClassValidatorErrorToStandardShape(
        classValidatorError: ClassValidatorError,
        stopOnFirstError: boolean = true
    ): ValidationErrorStandardShape[] {
        let newErrorsShape: ValidationErrorStandardShape[] = [];
        if (classValidatorError.constraints) {
            for (const constraint of Object.keys(classValidatorError.constraints)) {
                const err: ValidationErrorStandardShape = {
                    code: classValidatorError?.constraints?.[constraint] || 'UNKNOWN_CODE',
                    path: classValidatorError.property,
                    value: classValidatorError.value,
                    constraint: constraint,
                    originalContext: classValidatorError.contexts,
                };
                newErrorsShape.push(err);
                if (stopOnFirstError) break;
            }
        }
        return newErrorsShape;
    }

    /**
     * Transforms ClassValidatorError(s) to standardized validation error shapes.
     *
     * Handles both single errors and arrays of errors, including nested children errors.
     *
     * @private
     * @param classValidatorErrors - The ClassValidatorError or array of ClassValidatorErrors to transform
     * @param stopOnFirstError - Whether to stop processing after the first error (defaults to true)
     * @returns {ValidationErrorStandardShape[]} Array of standardized validation error shapes
     *
     * @since 1.0.0
     */
    private transformClassValidatorErrorsToStandardShape(
        classValidatorErrors: ClassValidatorError[] | ClassValidatorError,
        stopOnFirstError: boolean = true
    ): ValidationErrorStandardShape[] {
        let newErrorsShape: ValidationErrorStandardShape[] = [];
        if (!Array.isArray(classValidatorErrors)) {
            newErrorsShape.push(
                ...this.transformClassValidatorErrorToStandardShape(classValidatorErrors, stopOnFirstError)
            );
            return newErrorsShape;
        }

        for (const classValidatorError of classValidatorErrors) {
            if (classValidatorError.constraints && typeof classValidatorError.constraints === 'object') {
                newErrorsShape.push(
                    ...this.transformClassValidatorErrorToStandardShape(classValidatorError, stopOnFirstError)
                );
                if (stopOnFirstError) break;
            }

            if (classValidatorError.children && classValidatorError.children.length > 0) {
                newErrorsShape.push(
                    ...this.transformClassValidatorErrorsToStandardShape(classValidatorError.children, stopOnFirstError)
                );

                if (stopOnFirstError) break;
            }
        }

        return newErrorsShape;
    }

    /**
     * Extracts comprehensive request metadata for debugging and context purposes.
     *
     * Collects various request information including method, URL, headers, user agent,
     * IP address, and optionally the request body (if enabled and within size limits).
     *
     * @private
     * @param req - Express request object
     * @returns {RequestMetadata} Extracted request metadata
     *
     * @since 1.0.0
     */
    private extractRequestMetadata(req: Request): RequestMetadata {
        const metadata: RequestMetadata = {
            method: req.method,
            url: req.url,
            path: req.path,
            query: req.query,
            params: req.params,
            headers: req.headers as Record<string, string>,
            userAgent: req.get('user-agent') || 'unknown',
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
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
     * Assigns request metadata to the error context for enhanced debugging.
     *
     * @private
     * @param error - The CustomError to assign metadata to
     * @param req - Express request object
     * @returns {CustomError} Error with updated metadata context
     *
     * @since 1.0.0
     */
    private assignMetadata(error: CustomError, req: Request): CustomError {
        const metadata = this.extractRequestMetadata(req);
        error.updateContext({ ...error.context, metadata });
        return error;
    }

    /**
     * Extracts trace ID from request headers for distributed tracing.
     *
     * Looks for trace ID in multiple common header names:
     * - The configured traceIdHeader (default: 'x-trace-id')
     * - 'x-request-id' (common alternative)
     * - 'x-correlation-id' (another common alternative)
     *
     * @private
     * @param req - Express request object
     * @returns {string | undefined} Extracted trace ID or undefined if not found
     *
     * @since 1.0.0
     */
    private extractTraceId(req: Request): string | undefined {
        const traceId = req.get(this.options.traceIdHeader) || req.get('x-request-id') || req.get('x-correlation-id');
        return traceId || undefined;
    }

    /**
     * Assigns trace ID to the error for distributed tracing support.
     *
     * @param error - The CustomError to assign trace ID to
     * @param req - Express request object
     * @returns {CustomError} Error with assigned trace ID
     *
     * @since 1.0.0
     */
    assignTraceId(error: CustomError, req: Request): CustomError {
        const traceId = this.extractTraceId(req);
        error.setTraceId(traceId || 'unknown-trace-id');
        return error;
    }

    /**
     * Sends a standardized error response to the client.
     *
     * Creates a consistent JSON response format that includes error code,
     * service name, message, timestamp, trace ID, and HTTP status code.
     *
     * @private
     * @param res - Express response object
     * @param error - The CustomError to send as response
     *
     * @since 1.0.0
     */
    private sendErrorResponse(res: Response, error: CustomError): void {
        const response: ExpressErrorResponse = {
            code: error.code,
            serviceName: error.serviceName,
            message: error.message,
            timestamp: error.timestamp.toISOString(),
            traceId: error.traceId || 'unknown-trace-id',
            statusCode: error.statusCode,
        };

        res.status(error.statusCode).json(response);
    }

    /**
     * Sends a fallback error response when the error handler itself fails.
     *
     * This provides a safety net to ensure that even if the error processing
     * pipeline encounters issues, a basic error response is still sent to the client.
     *
     * @private
     * @param res - Express response object
     * @param originalError - The original error that caused the handler failure
     *
     * @since 1.0.0
     */
    private sendFallbackErrorResponse(res: Response, originalError: Error): void {
        const response: ExpressErrorResponse = {
            code: 'ERROR_HANDLER_FAILED',
            serviceName: this.options.serviceName,
            message: 'An error occurred while processing the request',
            timestamp: new Date().toISOString(),
            traceId: 'unknown',
            statusCode: 500,
        };

        res.status(500).json(response);
    }

    /**
     * Logs the error using the existing Console utility with structured output.
     *
     * Uses the configured logger to output error details with context and filtering
     * applied for consistent error logging across the application.
     *
     * @private
     * @param error - The CustomError to log
     *
     * @since 1.0.0
     */
    private logError(error: CustomError): void {
        error.log({ logContext: true, filter: true });
    }
}

/**
 * Factory function to create Express error handler middleware.
 *
 * This is a convenience function that creates a new ExpressErrorHandlerMiddleware
 * instance and returns its handler function in one step.
 *
 * @param options - Optional configuration options for the error handler
 * @returns {ExpressErrorHandler} Express error handler function
 *
 * @example
 * ```typescript
 * import { createExpressErrorHandler } from './middleware/ExpressErrorHandler';
 * import express from 'express';
 *
 * const app = express();
 *
 * // Create and use error handler
 * app.use(createExpressErrorHandler({
 *   serviceName: 'my-service',
 *   includeRequestBody: true
 * }));
 * ```
 *
 * @since 1.0.0
 */
export function createExpressErrorHandler(options?: ExpressErrorHandlerOptions): ExpressErrorHandler {
    const middleware = new ExpressErrorHandlerMiddleware(options);
    return middleware.getHandler();
}

/**
 * Default Express error handler with standard configuration.
 *
 * This is a pre-configured error handler instance that uses default settings.
 * It's ready to use out-of-the-box for most applications.
 *
 * @example
 * ```typescript
 * import { expressErrorHandler } from './middleware/ExpressErrorHandler';
 * import express from 'express';
 *
 * const app = express();
 * app.use(expressErrorHandler);
 * ```
 *
 * @since 1.0.0
 */
export const expressErrorHandler = createExpressErrorHandler();
