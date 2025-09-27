import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { CustomError, ValidationError } from '../core/Error';
import { ErrorFactory } from '../core/ErrorFactory';
import { ErrorCategoryEnum } from '../enums';
import {
    NestJSExceptionFilterOptions,
    NestJSExceptionResponse,
    NestJSErrorContext,
    NestJSRequestMetadata,
    HttpExceptionDetails,
    ValidationErrorStandardShape,
} from '../types/nestjs';
import { ZodError } from 'zod';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationErrorContext } from '../types';

/**
 * NestJS global exception filter that integrates with the existing error handling system.
 *
 * This filter catches all unhandled exceptions in NestJS applications, transforms them using the existing
 * CustomError classes, and returns standardized JSON responses.
 */
@Catch()
export class NestJSGlobalExceptionFilter implements ExceptionFilter {
    private errorFactory: ErrorFactory;
    private options: Required<NestJSExceptionFilterOptions>;

    constructor(options: NestJSExceptionFilterOptions = {}) {
        this.options = {
            serviceName: options.serviceName || process.env.SERVICE_NAME || 'unknown',
            traceIdHeader: options.traceIdHeader || 'x-trace-id',
            includeRequestBody: options.includeRequestBody || false,
            maxBodySize: options.maxBodySize || 1024,
            enableLogging: options.enableLogging !== false,
            logger: options.logger || console,
        };

        this.errorFactory = new ErrorFactory({
            serviceName: this.options.serviceName,
        });
    }

    /**
     * Main exception handling method
     */
    catch(exception: unknown, host: ArgumentsHost): void {
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
        } catch (handlerError) {
            // Fallback error handling if the exception filter itself fails
            this.options.logger.error('Error in NestJSGlobalExceptionFilter:', handlerError);
            this.sendFallbackErrorResponse(host, exception);
        }
    }

    /**
     * Transform various exception types to CustomError instances
     */
    private transformToCustomError(exception: unknown, host: ArgumentsHost): CustomError {
        // If already a CustomError, return as-is
        if (exception instanceof CustomError) {
            return exception;
        }

        // Handle Zod error transformation to validation error
        if (this.isZodError(exception)) {
            return this.transformZodErrorToValidationError(exception);
        }

        // Handle class-validator error transformation to validation error
        if (this.isClassValidatorError(exception)) {
            return this.transformClassValidatorErrorToValidationError(
                exception as unknown as ClassValidatorError | ClassValidatorError[]
            );
        }

        // Handle NestJS HttpException
        if (exception instanceof HttpException) {
            return this.transformHttpException(exception, host);
        }

        // Extract trace ID from request
        const traceId = this.extractTraceId(host);

        // Create error context with NestJS request data
        const context: NestJSErrorContext = {
            layer: 'CONTROLLER' as any,
            className: 'NestJSGlobalExceptionFilter',
            methodName: 'transformToCustomError',
            originalError: exception instanceof Error ? exception : new Error(String(exception)),
        };

        // Determine error category based on exception type and properties
        const category = this.determineErrorCategory(exception);

        // Create appropriate CustomError using ErrorFactory
        return this.errorFactory.createError(
            category,
            this.extractErrorCode(exception),
            this.extractErrorMessage(exception),
            context
        );
    }

    /**
     * Transform NestJS HttpException to CustomError
     */
    private transformHttpException(exception: HttpException, host: ArgumentsHost): CustomError {
        const status = exception.getStatus();
        const response = exception.getResponse();
        const traceId = this.extractTraceId(host);

        // Extract exception details
        const details: HttpExceptionDetails =
            typeof response === 'string'
                ? { statusCode: status, message: response }
                : {
                      statusCode: status,
                      message: (response as any)?.message || 'Unknown error',
                      ...response,
                  };

        // Create error context
        const context: NestJSErrorContext = {
            layer: 'CONTROLLER' as any,
            className: 'NestJSGlobalExceptionFilter',
            methodName: 'transformHttpException',
            originalError: exception,
            code: details.code || details.error,
        };

        // Determine error category based on status code
        const category = this.determineErrorCategoryFromStatus(status);

        // Create CustomError using ErrorFactory
        return this.errorFactory.createError(
            category,
            details.code || details.error || `HTTP_${status}`,
            Array.isArray(details.message) ? details.message.join(', ') : details.message,
            context
        );
    }

    /**
     * Check if exception is a Zod error
     */
    private isZodError(exception: unknown): exception is ZodError {
        return exception instanceof ZodError;
    }

    /**
     * Check if exception is a class-validator error
     */
    private isClassValidatorError(exception: unknown): boolean {
        if (Array.isArray(exception) && exception.length) {
            return exception.every((err) => err instanceof ClassValidatorError);
        }
        return exception instanceof ClassValidatorError;
    }

    /**
     * Transform Zod error to ValidationError
     */
    private transformZodErrorToValidationError(zodError: ZodError): ValidationError {
        let standardShapeError = this.transformZodErrorToStandardShape(zodError)[0];
        if (!standardShapeError) {
            console.warn('zod error transforming issue, check error handler');
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
     * Transform class-validator error to ValidationError
     */
    private transformClassValidatorErrorToValidationError(
        classValidatorError: ClassValidatorError | ClassValidatorError[]
    ): ValidationError {
        let standardShapeError = this.transformClassValidatorErrorsToStandardShape(classValidatorError)[0];
        if (!standardShapeError) {
            console.warn('class validator error transforming issue, check error handler');
            standardShapeError = { code: 'UNKNOWN_CLASS_VALIDATOR_ERROR' };
        }
        const errorContext: ValidationErrorContext = { ...standardShapeError };

        return new ValidationError({
            code: standardShapeError.code,
            message: standardShapeError.message,
            context: errorContext,
        });
    }

    /**
     * Transform Zod error to standard shape
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
     * Transform single class-validator error to standard shape
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
                    message: classValidatorError?.constraints?.[constraint] || 'UNKNOWN_MESSAGE',
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
     * Transform class-validator errors to standard shape
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
     * Determine error category based on exception properties
     */
    private determineErrorCategory(exception: unknown): ErrorCategoryEnum {
        if (exception instanceof Error) {
            const name = exception.name;
            const message = exception.message.toLowerCase();

            if (name === 'ValidationError' || message.includes('validation')) {
                return ErrorCategoryEnum.VALIDATION;
            }

            if (name === 'UnauthorizedError' || message.includes('unauthorized')) {
                return ErrorCategoryEnum.AUTHENTICATION;
            }

            if (name === 'ForbiddenError' || message.includes('forbidden')) {
                return ErrorCategoryEnum.AUTHORIZATION;
            }

            if (name === 'NotFoundError' || message.includes('not found')) {
                return ErrorCategoryEnum.NOT_FOUND;
            }

            if (name === 'ConflictError' || message.includes('conflict')) {
                return ErrorCategoryEnum.CONFLICT;
            }

            if (name === 'DatabaseError' || message.includes('database')) {
                return ErrorCategoryEnum.DATABASE;
            }

            if (name === 'NetworkError' || message.includes('network')) {
                return ErrorCategoryEnum.NETWORK;
            }

            if (name === 'ExternalServiceError' || message.includes('external service')) {
                return ErrorCategoryEnum.EXTERNAL_SERVICE;
            }
        }

        // Default to internal error for unknown types
        return ErrorCategoryEnum.INTERNAL;
    }

    /**
     * Determine error category from HTTP status code
     */
    private determineErrorCategoryFromStatus(status: number): ErrorCategoryEnum {
        if (status >= 400 && status < 500) {
            switch (status) {
                case 400:
                    return ErrorCategoryEnum.VALIDATION;
                case 401:
                    return ErrorCategoryEnum.AUTHENTICATION;
                case 403:
                    return ErrorCategoryEnum.AUTHORIZATION;
                case 404:
                    return ErrorCategoryEnum.NOT_FOUND;
                case 409:
                    return ErrorCategoryEnum.CONFLICT;
                default:
                    return ErrorCategoryEnum.VALIDATION;
            }
        }

        if (status >= 500) {
            return ErrorCategoryEnum.INTERNAL;
        }

        return ErrorCategoryEnum.INTERNAL;
    }

    /**
     * Extract error code from exception instance
     */
    private extractErrorCode(exception: unknown): string {
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
    private extractErrorMessage(exception: unknown): string {
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
    private extractTraceId(host: ArgumentsHost): string | undefined {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const headers = request?.headers || {};

        return headers[this.options.traceIdHeader] || headers['x-request-id'] || headers['x-correlation-id'];
    }

    /**
     * Extract comprehensive request metadata from NestJS ArgumentsHost
     */
    private extractRequestMetadata(host: ArgumentsHost): NestJSRequestMetadata {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const metadata: NestJSRequestMetadata = {
            method: request?.method || 'UNKNOWN',
            url: request?.url || '/',
            path: request?.path || '/',
            query: request?.query || {},
            params: request?.params || {},
            headers: request?.headers || {},
            userAgent: request?.get('user-agent') || 'unknown',
            ip: request?.ip || request?.connection?.remoteAddress || 'unknown',
            originalUrl: request?.originalUrl || request?.url || '/',
        };

        // Add controller and handler information if available
        if (request?.route) {
            metadata.route = request.route.path;
        }

        // Extract controller and handler names from request context
        const handler = request?.handler;
        if (handler) {
            metadata.controllerName = handler.constructor?.name || 'UnknownController';
            metadata.handlerName = handler.name || 'unknown';
        }

        // Include request body if enabled and within size limit
        if (this.options.includeRequestBody && request?.body) {
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
    private updateErrorContext(error: CustomError, metadata: NestJSRequestMetadata): void {
        const nestjsContext: NestJSErrorContext = {
            layer: 'CONTROLLER' as any,
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
        const traceId =
            metadata.headers[this.options.traceIdHeader.toLowerCase()] ||
            metadata.headers['x-request-id'] ||
            metadata.headers['x-correlation-id'];
        if (traceId) {
            error.setTraceId(traceId);
        }
    }

    /**
     * Log error using existing Console utility
     */
    private logError(error: CustomError, metadata: NestJSRequestMetadata): void {
        this.options.logger.error(`NestJS Exception Filter - ${metadata.method} ${metadata.path}`);
        error.log({ logContext: true, filter: true });
    }

    /**
     * Send standardized error response
     */
    private sendErrorResponse(host: ArgumentsHost, error: CustomError): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const responseBody: NestJSExceptionResponse = {
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
    private sendFallbackErrorResponse(host: ArgumentsHost, originalException: unknown): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const responseBody: NestJSExceptionResponse = {
            code: 'EXCEPTION_FILTER_FAILED',
            serviceName: this.options.serviceName,
            message: 'An error occurred while processing the request',
            timestamp: new Date().toISOString(),
            traceId: 'unknown',
            statusCode: 500,
        };

        response.status(500).json(responseBody);
    }
}

/**
 * Factory function to create NestJS exception filter
 */
export function createNestJSExceptionFilter(options?: NestJSExceptionFilterOptions): NestJSGlobalExceptionFilter {
    return new NestJSGlobalExceptionFilter(options);
}

/**
 * Default NestJS exception filter with standard configuration
 */
export const nestJSExceptionFilter = createNestJSExceptionFilter();
