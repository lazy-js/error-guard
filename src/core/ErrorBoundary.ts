import { ErrorInput } from './ErrorTransformer';
import { CustomError } from './Error';
import { ErrorContextBase } from '../types/errors';

export interface ErrorBoundaryOptions {
    onError?: (error: CustomError, context: ErrorContextBase) => void;
    onRecover?: (error: CustomError, context: ErrorContextBase) => void;
    maxRetries?: number;
    retryDelay?: number;
}

export class ErrorBoundary {
    private options: ErrorBoundaryOptions;

    constructor(options: ErrorBoundaryOptions = {}) {
        this.options = {
            maxRetries: 3,
            retryDelay: 1000,
            ...options,
        };
    }

    // Wrap a function with error boundary
    wrap<T extends (...args: any[]) => any>(
        fn: T,
        context: ErrorContextBase,
        errorHandler?: (error: ErrorInput) => CustomError
    ): T {
        return ((...args: Parameters<T>) => {
            try {
                return fn(...args);
            } catch (error) {
                const customError = errorHandler
                    ? errorHandler(error as ErrorInput)
                    : this.createErrorFromInput(error as ErrorInput, context);

                this.handleError(customError, context);
                throw customError;
            }
        }) as T;
    }

    // Wrap an async function with error boundary
    wrapAsync<T extends (...args: any[]) => Promise<any>>(
        fn: T,
        context: ErrorContextBase,
        errorHandler?: (error: ErrorInput) => CustomError
    ): T {
        return ((...args: Parameters<T>) => {
            return fn(...args).catch((error: ErrorInput) => {
                const customError = errorHandler ? errorHandler(error) : this.createErrorFromInput(error, context);

                this.handleError(customError, context);
                throw customError;
            });
        }) as T;
    }

    // Retry a function with exponential backoff
    async retry<T>(fn: () => Promise<T>, context: ErrorContextBase, maxRetries?: number): Promise<T> {
        const retries = maxRetries ?? this.options.maxRetries ?? 3;
        let lastError: CustomError | null = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = this.createErrorFromInput(error as ErrorInput, context);

                if (attempt === retries) {
                    this.handleError(lastError, context);
                    throw lastError;
                }

                // Exponential backoff
                const delay = (this.options.retryDelay ?? 1000) * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }

    // Create error from various input types
    private createErrorFromInput(error: ErrorInput, context: ErrorContextBase): CustomError {
        if (error instanceof CustomError) {
            return error;
        }

        if (error instanceof Error) {
            return new CustomError(
                {
                    code: 'UNKNOWN_ERROR',
                    message: error.message,
                    serviceName: context.serviceName || 'unknown',
                    category: 'internal' as any,
                    isOperational: false,
                    timestamp: new Date(),
                    context,
                    stack: error.stack,
                },
                'InternalError' as any
            );
        }

        if (typeof error === 'string') {
            return new CustomError(
                {
                    code: 'UNKNOWN_ERROR',
                    message: error,
                    serviceName: context.serviceName || 'unknown',
                    category: 'internal' as any,
                    isOperational: false,
                    timestamp: new Date(),
                    context,
                },
                'InternalError' as any
            );
        }

        return new CustomError(
            {
                code: 'UNKNOWN_ERROR',
                message: 'Unknown error occurred',
                serviceName: context.serviceName || 'unknown',
                category: 'internal' as any,
                isOperational: false,
                timestamp: new Date(),
                context,
            },
            'InternalError' as any
        );
    }

    // Handle error with callbacks
    private handleError(error: CustomError, context: ErrorContextBase): void {
        if (this.options.onError) {
            this.options.onError(error, context);
        }
    }

    // Handle recovery
    private handleRecover(error: CustomError, context: ErrorContextBase): void {
        if (this.options.onRecover) {
            this.options.onRecover(error, context);
        }
    }
}
