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
 * CustomError classes, and returns standardized JSON responses.
 */
export class ExpressErrorHandlerMiddleware {
    private options: Required<ExpressErrorHandlerOptions>;

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
     * Get the Express error handler function
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
     * Transform various error types to CustomError instances
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

    private isClassValidatorError(err: any): boolean {
        if (Array.isArray(err) && err.length) {
            return err.every((err) => err instanceof ClassValidatorError);
        }
        return err instanceof ClassValidatorError;
    }

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
     * Extract comprehensive request metadata
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
     * Assign metadata to error
     */
    private assignMetadata(error: CustomError, req: Request): CustomError {
        const metadata = this.extractRequestMetadata(req);
        error.updateContext({ ...error.context, metadata });
        return error;
    }

    /**
     * Extract trace ID from request headers
     */
    private extractTraceId(req: Request): string | undefined {
        const traceId = req.get(this.options.traceIdHeader) || req.get('x-request-id') || req.get('x-correlation-id');
        return traceId || undefined;
    }

    /**
     * Assign trace ID to error
     */
    assignTraceId(error: CustomError, req: Request): CustomError {
        const traceId = this.extractTraceId(req);
        error.setTraceId(traceId || 'unknown-trace-id');
        return error;
    }

    /**
     * Send standardized error response
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
     * Send fallback error response when error handler fails
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
     * Log error using existing Console utility
     */
    private logError(error: CustomError): void {
        error.log({ logContext: true, filter: true });
    }
}

/**
 * Factory function to create Express error handler middleware
 */
export function createExpressErrorHandler(options?: ExpressErrorHandlerOptions): ExpressErrorHandler {
    const middleware = new ExpressErrorHandlerMiddleware(options);
    return middleware.getHandler();
}

/**
 * Default Express error handler with standard configuration
 */
export const expressErrorHandler = createExpressErrorHandler();
