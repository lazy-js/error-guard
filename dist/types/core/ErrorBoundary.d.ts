import { ErrorInput } from './ErrorTransformer';
import { CustomError } from './Error';
import { ErrorContextBase } from '../types/errors';
export interface ErrorBoundaryOptions {
    onError?: (error: CustomError, context: ErrorContextBase) => void;
    onRecover?: (error: CustomError, context: ErrorContextBase) => void;
    maxRetries?: number;
    retryDelay?: number;
}
export declare class ErrorBoundary {
    private options;
    constructor(options?: ErrorBoundaryOptions);
    wrap<T extends (...args: any[]) => any>(fn: T, context: ErrorContextBase, errorHandler?: (error: ErrorInput) => CustomError): T;
    wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context: ErrorContextBase, errorHandler?: (error: ErrorInput) => CustomError): T;
    retry<T>(fn: () => Promise<T>, context: ErrorContextBase, maxRetries?: number): Promise<T>;
    private createErrorFromInput;
    private handleError;
    private handleRecover;
}
//# sourceMappingURL=ErrorBoundary.d.ts.map