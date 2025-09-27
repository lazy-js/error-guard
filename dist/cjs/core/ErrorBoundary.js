"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const Error_1 = require("./Error");
class ErrorBoundary {
    constructor(options = {}) {
        this.options = {
            maxRetries: 3,
            retryDelay: 1000,
            ...options,
        };
    }
    // Wrap a function with error boundary
    wrap(fn, context, errorHandler) {
        return ((...args) => {
            try {
                return fn(...args);
            }
            catch (error) {
                const customError = errorHandler
                    ? errorHandler(error)
                    : this.createErrorFromInput(error, context);
                this.handleError(customError, context);
                throw customError;
            }
        });
    }
    // Wrap an async function with error boundary
    wrapAsync(fn, context, errorHandler) {
        return ((...args) => {
            return fn(...args).catch((error) => {
                const customError = errorHandler ? errorHandler(error) : this.createErrorFromInput(error, context);
                this.handleError(customError, context);
                throw customError;
            });
        });
    }
    // Retry a function with exponential backoff
    async retry(fn, context, maxRetries) {
        var _a, _b;
        const retries = (_a = maxRetries !== null && maxRetries !== void 0 ? maxRetries : this.options.maxRetries) !== null && _a !== void 0 ? _a : 3;
        let lastError = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = this.createErrorFromInput(error, context);
                if (attempt === retries) {
                    this.handleError(lastError, context);
                    throw lastError;
                }
                // Exponential backoff
                const delay = ((_b = this.options.retryDelay) !== null && _b !== void 0 ? _b : 1000) * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    // Create error from various input types
    createErrorFromInput(error, context) {
        if (error instanceof Error_1.CustomError) {
            return error;
        }
        if (error instanceof Error) {
            return new Error_1.CustomError({
                code: 'UNKNOWN_ERROR',
                message: error.message,
                serviceName: context.serviceName || 'unknown',
                category: 'internal',
                isOperational: false,
                timestamp: new Date(),
                context,
                stack: error.stack,
            }, 'InternalError');
        }
        if (typeof error === 'string') {
            return new Error_1.CustomError({
                code: 'UNKNOWN_ERROR',
                message: error,
                serviceName: context.serviceName || 'unknown',
                category: 'internal',
                isOperational: false,
                timestamp: new Date(),
                context,
            }, 'InternalError');
        }
        return new Error_1.CustomError({
            code: 'UNKNOWN_ERROR',
            message: 'Unknown error occurred',
            serviceName: context.serviceName || 'unknown',
            category: 'internal',
            isOperational: false,
            timestamp: new Date(),
            context,
        }, 'InternalError');
    }
    // Handle error with callbacks
    handleError(error, context) {
        if (this.options.onError) {
            this.options.onError(error, context);
        }
    }
    // Handle recovery
    handleRecover(error, context) {
        if (this.options.onRecover) {
            this.options.onRecover(error, context);
        }
    }
}
exports.ErrorBoundary = ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.js.map