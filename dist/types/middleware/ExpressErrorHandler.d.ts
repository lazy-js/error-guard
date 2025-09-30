import { Request } from 'express';
import { CustomError } from '../core/Error';
import { ExpressErrorHandler, ExpressErrorHandlerOptions } from '../types/express';
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
export declare class ExpressErrorHandlerMiddleware {
    private options;
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
    constructor(options?: ExpressErrorHandlerOptions);
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
    getHandler(): ExpressErrorHandler;
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
    private transformToStandardError;
    /**
     * Checks if the provided error is a ClassValidatorError or array of ClassValidatorErrors.
     *
     * @private
     * @param err - The error to check
     * @returns {boolean} True if the error is a ClassValidatorError or array of ClassValidatorErrors
     *
     * @since 1.0.0
     */
    private isClassValidatorError;
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
    private transformZodErrorToValidationError;
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
    private transformClassValidatorErrorToValidationError;
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
    private transformZodErrorToStandardShape;
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
    private transformClassValidatorErrorToStandardShape;
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
    private transformClassValidatorErrorsToStandardShape;
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
    private extractRequestMetadata;
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
    private assignMetadata;
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
    private extractTraceId;
    /**
     * Assigns trace ID to the error for distributed tracing support.
     *
     * @param error - The CustomError to assign trace ID to
     * @param req - Express request object
     * @returns {CustomError} Error with assigned trace ID
     *
     * @since 1.0.0
     */
    assignTraceId(error: CustomError, req: Request): CustomError;
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
    private sendErrorResponse;
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
    private sendFallbackErrorResponse;
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
    private logError;
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
export declare function createExpressErrorHandler(options?: ExpressErrorHandlerOptions): ExpressErrorHandler;
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
export declare const expressErrorHandler: ExpressErrorHandler;
//# sourceMappingURL=ExpressErrorHandler.d.ts.map