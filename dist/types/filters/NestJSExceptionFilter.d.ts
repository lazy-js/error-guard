import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { NestJSExceptionFilterOptions } from '../types/nestjs';
/**
 * NestJS global exception filter that integrates with the existing error handling system.
 *
 * This filter catches all unhandled exceptions in NestJS applications, transforms them using the existing
 * CustomError classes, and returns standardized JSON responses.
 */
export declare class NestJSGlobalExceptionFilter implements ExceptionFilter {
    private errorFactory;
    private options;
    constructor(options?: NestJSExceptionFilterOptions);
    /**
     * Main exception handling method
     */
    catch(exception: unknown, host: ArgumentsHost): void;
    /**
     * Transform various exception types to CustomError instances
     */
    private transformToCustomError;
    /**
     * Transform NestJS HttpException to CustomError
     */
    private transformHttpException;
    /**
     * Check if exception is a Zod error
     */
    private isZodError;
    /**
     * Check if exception is a class-validator error
     */
    private isClassValidatorError;
    /**
     * Transform Zod error to ValidationError
     */
    private transformZodErrorToValidationError;
    /**
     * Transform class-validator error to ValidationError
     */
    private transformClassValidatorErrorToValidationError;
    /**
     * Transform Zod error to standard shape
     */
    private transformZodErrorToStandardShape;
    /**
     * Transform single class-validator error to standard shape
     */
    private transformClassValidatorErrorToStandardShape;
    /**
     * Transform class-validator errors to standard shape
     */
    private transformClassValidatorErrorsToStandardShape;
    /**
     * Determine error category based on exception properties
     */
    private determineErrorCategory;
    /**
     * Determine error category from HTTP status code
     */
    private determineErrorCategoryFromStatus;
    /**
     * Extract error code from exception instance
     */
    private extractErrorCode;
    /**
     * Extract error message from exception instance
     */
    private extractErrorMessage;
    /**
     * Extract trace ID from NestJS request
     */
    private extractTraceId;
    /**
     * Extract comprehensive request metadata from NestJS ArgumentsHost
     */
    private extractRequestMetadata;
    /**
     * Update error context with NestJS request metadata
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
     * Send fallback error response when exception filter fails
     */
    private sendFallbackErrorResponse;
}
/**
 * Factory function to create NestJS exception filter
 */
export declare function createNestJSExceptionFilter(options?: NestJSExceptionFilterOptions): NestJSGlobalExceptionFilter;
/**
 * Default NestJS exception filter with standard configuration
 */
export declare const nestJSExceptionFilter: NestJSGlobalExceptionFilter;
//# sourceMappingURL=NestJSExceptionFilter.d.ts.map