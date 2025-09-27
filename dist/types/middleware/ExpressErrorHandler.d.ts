import { ExpressErrorHandler, ExpressErrorHandlerOptions } from '../types/express';
/**
 * Express.js global error handler middleware that integrates with the existing error handling system.
 *
 * This middleware catches all unhandled errors in Express routes, transforms them using the existing
 * CustomError classes, and returns standardized JSON responses.
 */
export declare class ExpressErrorHandlerMiddleware {
    private errorFactory;
    private options;
    constructor(options?: ExpressErrorHandlerOptions);
    /**
     * Get the Express error handler function
     */
    getHandler(): ExpressErrorHandler;
    /**
     * Transform various error types to CustomError instances
     */
    private transformToCustomError;
    /**
     * Determine error category based on error properties
     */
    private determineErrorCategory;
    /**
     * Extract error code from error instance
     */
    private extractErrorCode;
    /**
     * Extract trace ID from request headers
     */
    private extractTraceId;
    /**
     * Extract comprehensive request metadata
     */
    private extractRequestMetadata;
    /**
     * Update error context with Express request metadata
     */
    private updateErrorContext;
    /**
     * Log error using existing Console utility
     */
    private logError;
    /**
     * Send standardized error response
     */
    private sendErrorResponse;
    /**
     * Send fallback error response when error handler fails
     */
    private sendFallbackErrorResponse;
}
/**
 * Factory function to create Express error handler middleware
 */
export declare function createExpressErrorHandler(options?: ExpressErrorHandlerOptions): ExpressErrorHandler;
/**
 * Default Express error handler with standard configuration
 */
export declare const expressErrorHandler: ExpressErrorHandler;
//# sourceMappingURL=ExpressErrorHandler.d.ts.map